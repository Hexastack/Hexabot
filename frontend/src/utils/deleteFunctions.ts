// Simulated delete functions for blocks and links
export const deleteBlock = async (id: string): Promise<void> => {
  console.log(`Deleting block: ${id}`);
  // Replace with your backend API logic
  await new Promise((resolve) => setTimeout(resolve, 500));
};

export const deleteLink = async (id: string): Promise<void> => {
  console.log(`Deleting link: ${id}`);
  // Replace with your backend API logic
  await new Promise((resolve) => setTimeout(resolve, 500));
};

// Bulk delete logic
export const deleteSelectedItems = async (
  items: { id: string; type: string }[],
) => {
  const promises = items.map((item) =>
    item.type === "block" ? deleteBlock(item.id) : deleteLink(item.id),
  );

  const results = await Promise.allSettled(promises);

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    console.error(
      "Failed to delete some items:",
      failed.map((f) => (f as PromiseRejectedResult).reason),
    );
    alert(
      `Failed to delete some items: ${failed
        .map((f) => (f as PromiseRejectedResult).reason)
        .join(", ")}`,
    );
  } else {
    alert("All selected items were successfully deleted.");
  }
};
