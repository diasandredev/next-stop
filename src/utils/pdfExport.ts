import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Trip, Dashboard, Card } from '@/types/kanban';
import { Group } from '@/types/group';
import { format } from 'date-fns';

export const generateTripPDF = (trip: Trip, dashboards: Dashboard[], cards: Card[], groups: Group[]) => {
  const doc = new jsPDF();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.text(trip.name, 14, yPos);
  yPos += 10;

  // Dates
  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateStr = trip.startDate 
    ? `${format(new Date(trip.startDate), 'MMM d, yyyy')} - ${trip.endDate ? format(new Date(trip.endDate), 'MMM d, yyyy') : 'Ongoing'}`
    : 'No dates set';
  doc.text(dateStr, 14, yPos);
  doc.setTextColor(0); // Reset color
  yPos += 20;

  // Sort Dashboards
  const sortedDashboards = [...dashboards].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });

  const currencyTotals: Record<string, number> = {};

  const addToTotals = (card: Card) => {
      if (card.cost) {
          const curr = card.currency || 'USD';
          currencyTotals[curr] = (currencyTotals[curr] || 0) + Number(card.cost);
      }
  };

  const renderCardTable = (cardList: Card[]) => {
      const tableBody = cardList.map(card => {
          addToTotals(card);
          
          const checklistInfo = card.checklist && card.checklist.length > 0
              ? `\nChecklist: ${card.checklist.filter(i => i.completed).length}/${card.checklist.length}` 
              : '';
          
          return [
              card.time || '-',
              card.title + checklistInfo,
              card.cost ? `${card.currency || '$'} ${card.cost}` : '-',
              card.notes || ''
          ];
       });

       autoTable(doc, {
          startY: yPos,
          head: [['Time', 'Activity', 'Cost', 'Notes']],
          body: tableBody,
          theme: 'grid',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [48, 77, 115] }, // Matches app theme roughly
          columnStyles: {
              0: { cellWidth: 20 },
              1: { cellWidth: 'auto' }, // Activity
              2: { cellWidth: 30 }, // Cost
              3: { cellWidth: 50 }  // Notes
          },
          margin: { top: 10 },
       });

       // Update yPos for next section
       // @ts-expect-error - autoTable adds lastAutoTable to doc instance but types might not be updated
       yPos = doc.lastAutoTable.finalY + 10;
  };

  const checkPageBreak = (threshold = 250) => {
      if (yPos > threshold) {
          doc.addPage();
          yPos = 20;
          return true;
      }
      return false;
  };

  sortedDashboards.forEach((dashboard) => {
    checkPageBreak();

    // Dashboard Header
    doc.setFontSize(16);
    doc.text(dashboard.name, 14, yPos);
    yPos += 10;

    // Get cards for this dashboard
    const dashboardCards = cards.filter(c => c.dashboardId === dashboard.id);
    
    // 1. Group by Date (Scheduled)
    const dates = Array.from(new Set(dashboardCards
        .filter(c => c.date)
        .map(c => c.date!)
    )).sort();

    dates.forEach(date => {
        const dateCards = dashboardCards.filter(c => c.date === date);
        
        // Sort cards
        dateCards.sort((a, b) => {
             const ao = a.order ?? Number.MAX_SAFE_INTEGER;
             const bo = b.order ?? Number.MAX_SAFE_INTEGER;
             if (ao !== bo) return ao - bo;
             return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        if (dateCards.length > 0) {
             checkPageBreak(240);

             // Date Subheader
             doc.setFontSize(12);
             doc.setTextColor(100);
             
             // Adjust for timezone issues by splitting or ensuring simple parsing if it's YYYY-MM-DD
             const [year, month, day] = date.split('-').map(Number);
             const dateObj = new Date(year, month - 1, day);
             const dateDisplay = format(dateObj, 'EEEE, MMM d');
             
             doc.text(dateDisplay, 14, yPos);
             yPos += 5;

             renderCardTable(dateCards);
        }
    });

    // 2. Groups (Right Sidebar)
    const dashboardGroups = groups
        .filter(g => g.dashboardId === dashboard.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    dashboardGroups.forEach(group => {
        const groupCards = dashboardCards.filter(c => c.groupId === group.id);
        
        groupCards.sort((a, b) => {
             const ao = a.order ?? Number.MAX_SAFE_INTEGER;
             const bo = b.order ?? Number.MAX_SAFE_INTEGER;
             if (ao !== bo) return ao - bo;
             return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        if (groupCards.length > 0) {
            checkPageBreak(240);
            
            doc.setFontSize(12);
            doc.setTextColor(100);
            doc.text(`Group: ${group.name}`, 14, yPos);
            yPos += 5;

            renderCardTable(groupCards);
        }
    });

    // 3. Truly Unscheduled (No Date, No Group)
    const unscheduledCards = dashboardCards.filter(c => !c.date && !c.groupId);
    unscheduledCards.sort((a, b) => {
        const ao = a.order ?? Number.MAX_SAFE_INTEGER;
        const bo = b.order ?? Number.MAX_SAFE_INTEGER;
        if (ao !== bo) return ao - bo;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
   });

    if (unscheduledCards.length > 0) {
        checkPageBreak(240);

        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text('Unscheduled Ideas', 14, yPos);
        yPos += 5;

        renderCardTable(unscheduledCards);
    }
    
    yPos += 10;
  });

  // Total Summary
  checkPageBreak(250);
  
  doc.setDrawColor(200);
  doc.line(14, yPos, 196, yPos);
  yPos += 10;
  
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Total Estimated Cost:', 14, yPos);
  yPos += 8;

  doc.setFontSize(12);
  const currencies = Object.keys(currencyTotals);
  if (currencies.length === 0) {
      doc.text('No costs recorded.', 14, yPos);
  } else {
      currencies.forEach(curr => {
          doc.text(`${curr} ${currencyTotals[curr].toFixed(2)}`, 14, yPos);
          yPos += 6;
      });
  }

  doc.save(`${trip.name.replace(/\s+/g, '_')}_Itinerary.pdf`);
};
