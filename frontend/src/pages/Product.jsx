import { useState } from "react"
import { FiSearch, FiEdit2, FiTrash2, FiPlus, FiGrid, FiList, FiPackage, FiTag, FiDollarSign, FiArchive } from "react-icons/fi"

/* ─── Product Card Component ─── */
function ProductCard({ product, onEdit, onDelete }) {
  return (
    <div className="bg-box-bg dark:bg-box-dark-bg rounded-xl border border-black/[.04] dark:border-white/[.06] p-4 hover:shadow-md transition-all duration-250">
      <div className="flex gap-4">
        {/* Product Image Placeholder */}
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-950/40 dark:to-blue-950/40 flex items-center justify-center shrink-0">
          <FiPackage className="w-8 h-8 text-sky-400" />
        </div>
        
        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-white truncate">{product.name}</h3>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button 
                onClick={() => onEdit(product)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors"
              >
                <FiEdit2 size={14} />
              </button>
              <button 
                onClick={() => onDelete(product)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
          
          {/* Product Stats */}
          <div className="flex flex-wrap gap-3 mt-3 text-xs">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <FiTag size={12} />
              <span className="font-medium">{product.category}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <FiDollarSign size={12} />
              <span className="font-medium">${product.price.toLocaleString()}</span>
            </span>
            <span className={`flex items-center gap-1 ${product.stock > 0 ? 'text-teal-500' : 'text-orange-500'}`}>
              <FiArchive size={12} />
              <span className="font-medium">{product.stock} in stock</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Sample Product Data ─── */
const SAMPLE_PRODUCTS = [
  { id: 1, name: "USB-C Hub Pro", description: "7-in-1 USB-C hub with 4K HDMI, 100W PD, and SD card reader", category: "Electronics", price: 49.99, stock: 284 },
  { id: 2, name: "Mechanical Keyboard", description: "Wireless mechanical keyboard with RGB backlight", category: "Peripherals", price: 89.99, stock: 231 },
  { id: 3, name: "27\" Monitor", description: "4K UHD IPS monitor with HDR10", category: "Displays", price: 299.99, stock: 198 },
  { id: 4, name: "Webcam 4K", description: "Ultra HD webcam with auto-focus and dual mics", category: "Electronics", price: 129.99, stock: 175 },
  { id: 5, name: "Laptop Stand", description: "Aluminum ergonomic laptop stand", category: "Accessories", price: 39.99, stock: 162 },
  { id: 6, name: "Mouse Pad XL", description: "Gaming mouse pad with stitched edges", category: "Accessories", price: 19.99, stock: 148 },
  { id: 7, name: "Headset Pro", description: "Wireless gaming headset with 7.1 surround sound", category: "Audio", price: 79.99, stock: 134 },
  { id: 8, name: "SD Card 256GB", description: "High-speed SD card for cameras and devices", category: "Storage", price: 34.99, stock: 119 },
  { id: 9, name: "Portable SSD", description: "1TB external SSD with USB-C", category: "Storage", price: 109.99, stock: 103 },
  { id: 10, name: "Phone Stand", description: "Adjustable desk phone stand", category: "Accessories", price: 14.99, stock: 87 },
]

/* ─── Category Filters ─── */
const CATEGORIES = ["All", "Electronics", "Peripherals", "Displays", "Accessories", "Audio", "Storage"]

export default function Products() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState("list") // list or grid
  const [products, setProducts] = useState(SAMPLE_PRODUCTS)

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEdit = (product) => {
    console.log("Edit product:", product)
    // Implement edit logic
  }

  const handleDelete = (product) => {
    if (confirm(`Delete "${product.name}"?`)) {
      setProducts(products.filter(p => p.id !== product.id))
    }
  }

  const handleAddProduct = () => {
    console.log("Add new product")
    // Implement add logic
  }

  return (
    <div className="h-screen bg-main-bg dark:bg-main-dark-bg">
      <div className="h-full p-5 flex flex-col gap-5 overflow-hidden">
        
        {/* Header with User Info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Products</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage your product inventory</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">John Doe</p>
              <p className="text-xs text-slate-400">Administrator</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
              JD
            </div>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-box-bg dark:bg-box-dark-bg border border-black/[.04] dark:border-white/[.06] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-sky-400 transition-all duration-250"
            />
          </div>
          
          {/* View Toggle & Add Button */}
          <div className="flex gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-box-bg dark:bg-box-dark-bg border border-black/[.04] dark:border-white/[.06] text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:border-sky-400 transition-all duration-250"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex rounded-xl bg-box-bg dark:bg-box-dark-bg border border-black/[.04] dark:border-white/[.06] p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-250 ${viewMode === "list" ? "bg-sky-100 dark:bg-sky-950/40 text-sky-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <FiList size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-250 ${viewMode === "grid" ? "bg-sky-100 dark:bg-sky-950/40 text-sky-500" : "text-slate-400 hover:text-slate-600"}`}
              >
                <FiGrid size={16} />
              </button>
            </div>
            
            {/* Add Product Button */}
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium transition-all duration-250 shadow-sm"
            >
              <FiPlus size={16} />
              <span className="hidden sm:inline">Add Product</span>
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          {searchQuery && (
            <span>Search: "{searchQuery}"</span>
          )}
        </div>

        {/* Products List/Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FiPackage className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No products found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : viewMode === "list" ? (
            <div className="space-y-3">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 