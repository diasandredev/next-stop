import { useState } from 'react';
import { Input } from './ui/input';

interface QuickAddCardProps {
  onAdd: (title: string) => void;
  onCancel: () => void;
}

export const QuickAddCard = ({ onAdd, onCancel }: QuickAddCardProps) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  const handleBlur = () => {
    if (title.trim()) {
      onAdd(title.trim());
    } else {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleBlur}
        placeholder="Enter card title..."
        className="bg-muted/50 border-border"
        autoFocus
      />
    </form>
  );
};
