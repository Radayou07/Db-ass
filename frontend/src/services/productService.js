// Create a services folder with mock data
// src/services/productService.js

export const productService = {
  // Mock API calls
  async getProducts() {
    return MOCK_PRODUCTS
  },
  
  async createProduct(data) {
    const newProduct = { id: Date.now(), ...data }
    MOCK_PRODUCTS.push(newProduct)
    return newProduct
  },
  
  async updateProduct(id, data) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...data }
    return MOCK_PRODUCTS[index]
  },
  
  async deleteProduct(id) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    MOCK_PRODUCTS.splice(index, 1)
    return { success: true }
  }
}