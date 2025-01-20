import React, { useState } from "react";

// Define the Item interface
interface Item {
  id: string;
  type: "block" | "link";
}

// Props for the MultiSelectDelete component
interface MultiSelectDeleteProps {
  items: Item[];
  onDelete: (selectedItems: Item[]) => void;
}

const MultiSelectDelete: React.FC<MultiSelectDeleteProps> = ({
  items,
  onDelete,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Toggle item selection
  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Trigger delete action
  const handleDelete = () => {
    const selected = items.filter((item) => selectedItems.has(item.id));
    onDelete(selected);
    setSelectedItems(new Set()); // Reset selection after deletion
  };

  return (
    <div>
      <h3>Bulk Delete</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedItems.has(item.id)}
                onChange={() => toggleSelection(item.id)}
              />
              {`${item.type}: ${item.id}`}
            </label>
          </li>
        ))}
      </ul>
      <button onClick={handleDelete} disabled={selectedItems.size === 0}>
        Delete Selected
      </button>
    </div>
  );
};

export default MultiSelectDelete;
