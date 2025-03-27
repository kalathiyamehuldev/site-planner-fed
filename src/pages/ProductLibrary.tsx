
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  Package, 
  ShoppingBag, 
  Edit, 
  Trash2,
  ChevronDown,
  Grid,
  List,
  Image
} from "lucide-react";

// Mock data for products
const products = [
  {
    id: "p1",
    name: "Modern Sectional Sofa",
    category: "Furniture",
    subcategory: "Sofas",
    sku: "FURN-SOF-001",
    vendor: "Modern Furnishings Inc.",
    price: 2500,
    dimensions: "108" x 52" x 36"",
    color: "Charcoal Gray",
    material: "Polyester, Wood",
    inStock: true,
    image: null
  },
  {
    id: "p2",
    name: "Glass Coffee Table",
    category: "Furniture",
    subcategory: "Tables",
    sku: "FURN-TBL-002",
    vendor: "Modern Furnishings Inc.",
    price: 800,
    dimensions: "48" x 28" x 18"",
    color: "Clear/Black",
    material: "Glass, Steel",
    inStock: true,
    image: null
  },
  {
    id: "p3",
    name: "Pendant Light Fixture",
    category: "Lighting",
    subcategory: "Ceiling Lights",
    sku: "LIGHT-PND-001",
    vendor: "Artistic Lighting Solutions",
    price: 250,
    dimensions: "14" diameter x 16" height",
    color: "Brass",
    material: "Metal, Glass",
    inStock: true,
    image: null
  },
  {
    id: "p4",
    name: "Wool Area Rug",
    category: "Decor",
    subcategory: "Rugs",
    sku: "DECOR-RUG-001",
    vendor: "Premium Fabric Wholesalers",
    price: 1200,
    dimensions: "8' x 10'",
    color: "Ivory/Blue",
    material: "100% Wool",
    inStock: false,
    image: null
  },
  {
    id: "p5",
    name: "Engineered Hardwood Flooring",
    category: "Flooring",
    subcategory: "Wood",
    sku: "FLOOR-WD-001",
    vendor: "Eco-Friendly Flooring Co.",
    price: 8,
    dimensions: "7.5" x 72"",
    color: "Natural Oak",
    material: "Engineered Hardwood",
    inStock: true,
    image: null
  },
  {
    id: "p6",
    name: "Marble Countertop",
    category: "Surfaces",
    subcategory: "Countertops",
    sku: "SURF-CT-001",
    vendor: "Stone Works",
    price: 75,
    dimensions: "Per square foot",
    color: "Calacatta Gold",
    material: "Marble",
    inStock: true,
    image: null
  },
  {
    id: "p7",
    name: "Velvet Accent Chair",
    category: "Furniture",
    subcategory: "Chairs",
    sku: "FURN-CHR-001",
    vendor: "Modern Furnishings Inc.",
    price: 650,
    dimensions: "32" x 28" x 33"",
    color: "Navy Blue",
    material: "Velvet, Wood",
    inStock: true,
    image: null
  },
  {
    id: "p8",
    name: "Ceramic Table Lamp",
    category: "Lighting",
    subcategory: "Table Lamps",
    sku: "LIGHT-TBL-001",
    vendor: "Artistic Lighting Solutions",
    price: 180,
    dimensions: "16" diameter x 26" height",
    color: "White",
    material: "Ceramic, Linen",
    inStock: false,
    image: null
  }
];

// Categories for filtering
const categories = [
  "All",
  "Furniture",
  "Lighting",
  "Decor",
  "Flooring",
  "Surfaces"
];

const ProductLibrary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.vendor.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Product Library</h1>
            <p className="text-muted-foreground">Catalog of furniture, fixtures, and materials</p>
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

        {/* Products Grid/List */}
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
              filteredProducts.map(product => (
                <GlassCard 
                  key={product.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="h-48 bg-secondary/30 flex items-center justify-center">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image className="text-muted-foreground" size={48} />
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium truncate" title={product.name}>
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">{product.sku}</p>
                      </div>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded-full",
                        product.inStock 
                          ? "bg-green-100 text-green-600" 
                          : "bg-amber-100 text-amber-600"
                      )}>
                        {product.inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Category</p>
                        <p>{product.subcategory}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Price</p>
                        <p className="font-medium">${product.price.toFixed(2)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-muted-foreground">Vendor</p>
                        <p className="truncate" title={product.vendor}>{product.vendor}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-border flex justify-end gap-1">
                      <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                        <Edit size={16} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                        <ShoppingBag size={16} />
                      </button>
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
                      <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Vendor</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                      <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id} className="border-b last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-secondary/50 rounded flex items-center justify-center flex-shrink-0">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover rounded"
                                />
                              ) : (
                                <Package className="text-muted-foreground" size={20} />
                              )}
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-muted-foreground">{product.sku}</td>
                        <td className="p-4">{product.subcategory}</td>
                        <td className="p-4">{product.vendor}</td>
                        <td className="p-4 text-right font-medium">${product.price.toFixed(2)}</td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            <span className={cn(
                              "text-xs px-2 py-1 rounded-full inline-block",
                              product.inStock 
                                ? "bg-green-100 text-green-600" 
                                : "bg-amber-100 text-amber-600"
                            )}>
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-1">
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <Edit size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-destructive">
                              <Trash2 size={16} />
                            </button>
                            <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                              <ShoppingBag size={16} />
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
