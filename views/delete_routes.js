app.delete('/api/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const deletedItem = await Item.findByIdAndDelete(id);
  
      if (!deletedItem) {
        return res.status(404).send({ message: 'Item not found' });
      }
  
      res.status(200).send({ message: 'Item deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Server error' });
    }
  });