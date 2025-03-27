
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Mock data for products
const initialProducts = [
  {
    id: "prod1",
    name: "Modern Leather Sofa",
    category: "Furniture",
    type: "Sofa",
    manufacturer: "Luxe Living",
    price: 2499.99,
    dimensions: "84\"W x 36\"D x 32\"H",
    materials: ["Leather", "Wood", "Metal"],
    colors: ["Black", "White", "Brown"],
    inStock: true,
    leadTime: "3-4 weeks",
    tags: ["modern", "living room", "premium"],
    description: "Sleek modern leather sofa with clean lines and sturdy construction",
    sku: "LL-SOFA-001",
    vendorId: "v3",
    vendorName: "Modern Furnishings Inc.",
    thumbnail: null
  },
  {
    id: "prod2",
    name: "Glass Coffee Table",
    category: "Furniture",
    type: "Table",
    manufacturer: "Modern Designs",
    price: 799.99,
    dimensions: "48\"W x 24\"D x 18\"H",
    materials: ["Glass", "Stainless Steel"],
    colors: ["Clear", "Frosted"],
    inStock: true,
    leadTime: "2 weeks",
    tags: ["modern", "living room", "glass"],
    description: "Minimalist glass coffee table with stainless steel frame",
    sku: "MD-TABLE-102",
    vendorId: "v3",
    vendorName: "Modern Furnishings Inc.",
    thumbnail: null
  },
  {
    id: "prod3",
    name: "Velvet Armchair",
    category: "Furniture",
    type: "Chair",
    manufacturer: "Luxe Living",
    price: 899.99,
    dimensions: "30\"W x 34\"D x 33\"H",
    materials: ["Velvet", "Wood"],
    colors: ["Navy", "Emerald", "Blush", "Gray"],
    inStock: false,
    leadTime: "5-6 weeks",
    tags: ["accent", "living room", "comfortable"],
    description: "Luxurious velvet armchair with wooden legs and plush cushioning",
    sku: "LL-CHAIR-056",
    vendorId: "v3",
    vendorName: "Modern Furnishings Inc.",
    thumbnail: null
  },
  {
    id: "prod4",
    name: "Ceramic Table Lamp",
    category: "Lighting",
    type: "Table Lamp",
    manufacturer: "Illuminate",
    price: 249.99,
    dimensions: "14\"W x 14\"D x 26\"H",
    materials: ["Ceramic", "Linen"],
    colors: ["White", "Blue", "Green"],
    inStock: true,
    leadTime: "1 week",
    tags: ["lighting", "accent", "ceramic"],
    description: "Handcrafted ceramic table lamp with linen shade",
    sku: "IL-LAMP-224",
    vendorId: "v2",
    vendorName: "Artistic Lighting Solutions",
    thumbnail: null
  },
  {
    id: "prod5",
    name: "Wool Area Rug",
    category: "Textiles",
    type: "Rug",
    manufacturer: "Soft Furnishings Co.",
    price: 1199.99,
    dimensions: "8' x 10'",
    materials: ["Wool"],
    colors: ["Beige", "Gray", "Multi"],
    inStock: true,
    leadTime: "2-3 weeks",
    tags: ["flooring", "soft", "wool"],
    description: "100% wool area rug with hand-knotted construction",
    sku: "SF-RUG-810",
    vendorId: "v3",
    vendorName: "Premium Fabric Wholesalers",
    thumbnail: null
  },
  {
    id: "prod6",
    name: "Pendant Light Fixture",
    category: "Lighting",
    type: "Pendant",
    manufacturer: "Illuminate",
    price: 349.99,
    dimensions: "16\"W x 16\"D x 20\"H",
    materials: ["Brass", "Glass"],
    colors: ["Brass", "Matte Black"],
    inStock: false,
    leadTime: "4 weeks",
    tags: ["lighting", "ceiling", "statement"],
    description: "Modern brass and glass pendant light for dining or entryway",
    sku: "IL-PEND-118",
    vendorId: "v2",
    vendorName: "Artistic Lighting Solutions",
    thumbnail: null
  },
  {
    id: "prod7",
    name: "Marble Dining Table",
    category: "Furniture",
    type: "Table",
    manufacturer: "Stone & Wood Designs",
    price: 3499.99,
    dimensions: "72\"W x 38\"D x 30\"H",
    materials: ["Marble", "Wood"],
    colors: ["White Marble/Walnut", "Black Marble/Oak"],
    inStock: false,
    leadTime: "8-10 weeks",
    tags: ["dining", "marble", "premium"],
    description: "Luxurious dining table with marble top and solid wood base",
    sku: "SW-TABLE-072",
    vendorId: "v3",
    vendorName: "Modern Furnishings Inc.",
    thumbnail: null
  },
  {
    id: "prod8",
    name: "Linen Curtains",
    category: "Textiles",
    type: "Window Treatment",
    manufacturer: "Soft Furnishings Co.",
    price: 199.99,
    dimensions: "52\"W x 96\"L",
    materials: ["Linen"],
    colors: ["White", "Natural", "Navy", "Gray"],
    inStock: true,
    leadTime: "1-2 weeks",
    tags: ["window", "linen", "drapery"],
    description: "100% linen curtains with rod pocket top",
    sku: "SF-CURT-5296",
    vendorId: "v3",
    vendorName: "Premium Fabric Wholesalers",
    thumbnail: null
  }
];

export type Product = typeof initialProducts[0];

interface ProductsState {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: initialProducts,
  selectedProduct: null,
  loading: false,
  error: null
};

export const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    getProducts: (state) => {
      state.loading = false;
      state.error = null;
    },
    setSelectedProduct: (state, action: PayloadAction<string>) => {
      state.selectedProduct = state.products.find(product => product.id === action.payload) || null;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    addProduct: (state, action: PayloadAction<Omit<Product, 'id'>>) => {
      const newProduct = {
        ...action.payload,
        id: `prod${state.products.length + 1}`,
      };
      state.products.push(newProduct);
    },
    updateProduct: (state, action: PayloadAction<{ id: string; product: Partial<Product> }>) => {
      const { id, product } = action.payload;
      const index = state.products.findIndex(p => p.id === id);
      if (index !== -1) {
        state.products[index] = { ...state.products[index], ...product };
        if (state.selectedProduct?.id === id) {
          state.selectedProduct = state.products[index];
        }
      }
    },
    deleteProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(product => product.id !== action.payload);
      if (state.selectedProduct?.id === action.payload) {
        state.selectedProduct = null;
      }
    },
    updateProductStock: (state, action: PayloadAction<{ id: string; inStock: boolean }>) => {
      const { id, inStock } = action.payload;
      const product = state.products.find(p => p.id === id);
      if (product) {
        product.inStock = inStock;
      }
    },
    updateProductPrice: (state, action: PayloadAction<{ id: string; price: number }>) => {
      const { id, price } = action.payload;
      const product = state.products.find(p => p.id === id);
      if (product) {
        product.price = price;
      }
    }
  }
});

export const { 
  getProducts, 
  setSelectedProduct, 
  clearSelectedProduct, 
  addProduct, 
  updateProduct, 
  deleteProduct,
  updateProductStock,
  updateProductPrice
} = productsSlice.actions;

export const selectAllProducts = (state: RootState) => state.products.products;
export const selectSelectedProduct = (state: RootState) => state.products.selectedProduct;
export const selectProductById = (id: string) => (state: RootState) => 
  state.products.products.find(product => product.id === id);
export const selectProductsByCategory = (category: string) => (state: RootState) => 
  state.products.products.filter(product => product.category === category);
export const selectProductsByType = (type: string) => (state: RootState) => 
  state.products.products.filter(product => product.type === type);
export const selectProductsByVendor = (vendorId: string) => (state: RootState) => 
  state.products.products.filter(product => product.vendorId === vendorId);
export const selectInStockProducts = (state: RootState) => 
  state.products.products.filter(product => product.inStock);
export const selectOutOfStockProducts = (state: RootState) => 
  state.products.products.filter(product => !product.inStock);

export default productsSlice.reducer;
