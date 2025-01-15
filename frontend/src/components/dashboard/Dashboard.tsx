import React from "react";
import MultiSelectDelete from "../components/MultiSelectDelete";
import { deleteSelectedItems } from "../utils/deleteFunctions";

const Dashboard: React.FC = () => {
  // Simulated items (replace with real data from props, state, or API)
  const items = [
    { id: "block1", type: "block" },
    { id: "link1", type: "link" },
    { id: "block2", type: "block" },
    { id: "link2", type: "link" },
  ];

  const handleDelete = async (
    selectedItems: { id: string; type: string }[],
  ) => {
    await deleteSelectedItems(selectedItems);
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <MultiSelectDelete items={items} onDelete={handleDelete} />
    </div>
  );
};

export default Dashboard;
