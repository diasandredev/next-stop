export const getCurrencySymbol = (curr?: string) => {
    switch(curr) {
        case 'USD': return '$';
        case 'EUR': return '€';
        case 'GBP': return '£';
        case 'BRL': return 'R$';
        default: return curr || '$';
    }
};
