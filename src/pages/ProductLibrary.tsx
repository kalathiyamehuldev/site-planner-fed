
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Package, 
  ShoppingCart, 
  Download, 
  MoreHorizontal,
  Edit,
  Trash2,
  Tag,
  DollarSign,
  Bookmark,
  Building
} from "lucide-react";

// Mock data for products
const mockProducts = [
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
    thumbnail: null
  }
];

// Categories for filtering
const categories = ["All", "Furniture", "Lighting", "Textiles", "Decor", "Appliances"];

// Types for filtering
const types = ["All", "Sofa", "Chair", "Table", "Lamp", "Rug", "Window Treatment", "Pendant"];

const ProductLibrary = () => {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filter products based on search, category, and type
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesType = selectedType === "All" || product.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Product Library</h1>
            <p className="text-muted-foreground">Manage your catalog of furniture, fixtures, and materials</p>
          </div>
          <MotionButton variant="default" motion="subtle">
            <Plus size={18} className="mr-2" /> Add Product
          </MotionButton>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search products..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="relative">
              <select
                className="appearance-none px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground" size={16} />
            </div>
            
            <div className="relative">
              <select
                className="appearance-none px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-8"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-muted-foreground" size={16} />
            </div>
            
            <div className="flex rounded-lg border border-input overflow-hidden">
              <button
                className={cn(
                  "px-3 py-2 text-sm",
                  viewMode === "grid" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-background text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid size={16} />
              </button>
              <button
                className={cn(
                  "px-3 py-2 text-sm",
                  viewMode === "list" 
                    ? "bg-primary/10 text-primary" 
                    : "bg-background text-muted-foreground hover:bg-secondary"
                )}
                onClick={() => setViewMode("list")}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Product Library */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in animation-delay-[0.2s]">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full">
                <GlassCard className="p-8 text-center">
                  <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
                  <h3 className="text-xl font-medium mb-2">No Products Found</h3>
                  <p className="text-muted-foreground mb-6">
                    No products match your current filters. Try a different search or category.
                  </p>
                  <MotionButton variant="default" motion="subtle">
                    <Plus size={18} className="mr-2" /> Add New Product
                  </MotionButton>
                </GlassCard>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <GlassCard 
                  key={product.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-square bg-secondary/20 flex items-center justify-center relative group">
                    {product.thumbnail ? (
                      <img 
                        src={product.thumbnail} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="text-muted-foreground" size={48} />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-white">
                        <Edit size={18} />
                      </button>
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors text-white">
                        <ShoppingCart size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium truncate" title={product.name}>
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        product.inStock 
                          ? "bg-green-100 text-green-600" 
                          : "bg-amber-100 text-amber-600"
                      )}>
                        {product.inStock ? "In Stock" : `${product.leadTime}`}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center text-lg font-medium">
                      <DollarSign size={16} className="text-muted-foreground" />
                      {formatCurrency(product.price)}
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {product.category} / {product.type}
                      </span>
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                          <Download size={16} />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            )}
          </div>
        ) : (
          <GlassCard className="animate-fade-in animation-delay-[0.2s]">
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-xl font-medium mb-2">No Products Found</h3>
                <p className="text-muted-foreground mb-6">
                  No products match your current filters. Try a different search or category.
                </p>
                <MotionButton variant="default" motion="subtle">
                  <Plus size={18} className="mr-2" /> Add New Product
                </MotionButton>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Manufacturer</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-secondary/50 rounded flex items-center justify-center">
                              {product.thumbnail ? (
                                <img 
                                  src={product.thumbnail} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <Package className="text-muted-foreground" size={20} />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.dimensions}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span>{product.category}</span>
                          <p className="text-xs text-muted-foreground">{product.type}</p>
                        </td>
                        <td className="p-4">{product.manufacturer}</td>
                        <td className="p-4 font-medium">{formatCurrency(product.price)}</td>
                        <td className="p-4">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            product.inStock 
                              ? "bg-green-100 text-green-600" 
                              : "bg-amber-100 text-amber-600"
                          )}>
                            {product.inStock ? "In Stock" : "Lead time: " + product.leadTime}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <Edit size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <ShoppingCart size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        )}
      </div>
    </PageContainer>
  );
};

export default ProductLibrary;
