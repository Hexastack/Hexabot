import express, { Request, Response } from 'express';
import { Block } from './models/Block';
import { Category } from './models/Category';

const app = express();
const port = 3000;


app.use(express.json());


app.post('/move-block', async (req: Request, res: Response) => {
  const { block_id, category_id } = req.body;

  
  if (!block_id || !category_id) {
    return res.status(400).json({ error: 'Block ID and Category ID are required' });
  }

  try {
    
    const block = await Block.findOne({ where: { id: block_id } });
    const category = await Category.findOne({ where: { id: category_id } });

    
    if (!block || !category) {
      return res.status(400).json({ error: 'Invalid block or category' });
    }

    
    if (block.categoryId === category.id) {
      return res.status(200).json({ message: 'Block is already in the selected category' });
    }

    
    block.categoryId = category.id;
    await block.save();

    return res.status(200).json({ message: 'Block moved successfully!' });
  } catch (error) {
    console.error('Error moving block:', error);
    return res.status(500).json({ error: 'An error occurred while moving the block.' });
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
