
interface Block {
    id: string;
    type: string; 
  }
  
  
  interface ApiResponse {
    status: number;
    message: string;
  }
  
  class MoveBlockHandler {
    private lastSelected: Block | null = null;
    private targetCategoryId: string | null = null;
  
    constructor(private moveButtonId: string) {}
  
    
    public selectBlock(selection: Block): void {
      if (selection.type === 'block') {
        this.lastSelected = selection;
      }
  
      
      this.updateMoveButtonState();
    }
  
    
    public selectTargetCategory(categoryId: string): void {
      this.targetCategoryId = categoryId;
      this.updateMoveButtonState();
    }
  
    
    private updateMoveButtonState(): void {
      const moveButton = document.getElementById(this.moveButtonId) as HTMLButtonElement;
  
      if (this.lastSelected && this.targetCategoryId && this.lastSelected.type === 'block') {
        moveButton.disabled = false; 
      } else {
        moveButton.disabled = true; 
      }
    }
  
    
    public async moveButtonClick(): Promise<void> {
      if (!this.lastSelected || !this.targetCategoryId) {
        alert('Please select both a block and a valid target category.');
        return;
      }
  
      try {
        const response = await this.moveBlockApiCall(this.lastSelected.id, this.targetCategoryId);
        
        if (response.status === 200) {
          alert('Block moved successfully!');
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error('API Error:', error);
        alert('An error occurred while moving the block.');
      }
    }
  
    
    private async moveBlockApiCall(blockId: string, categoryId: string): Promise<ApiResponse> {
      
      return new Promise<ApiResponse>((resolve, reject) => {
        setTimeout(() => {
          
          const success = Math.random() > 0.1;
          if (success) {
            resolve({ status: 200, message: 'Block moved successfully!' });
          } else {
            reject({ status: 500, message: 'Internal Server Error' });
          }
        }, 1000);
      });
    }
  }
  
  
  
  
  const moveBlockHandler = new MoveBlockHandler('moveButton');
  
  
  document.getElementById('selectBlockButton')?.addEventListener('click', () => {
    
    const block: Block = { id: 'block123', type: 'block' };
    moveBlockHandler.selectBlock(block);
  });
  
  document.getElementById('selectCategoryButton')?.addEventListener('click', () => {
    
    moveBlockHandler.selectTargetCategory('category456');
  });
  
  document.getElementById('moveButton')?.addEventListener('click', () => {
    moveBlockHandler.moveButtonClick();
  });
  