
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import { MotionButton } from "@/components/ui/motion-button";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingBag, 
  Download, 
  Mail, 
  TruckIcon,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Calendar
} from "lucide-react";

// Mock data for purchase orders
const purchaseOrders = [
  {
    id: "PO-2023-001",
    vendor: "Modern Furnishings Inc.",
    project: "Modern Loft Redesign",
    date: "2023-08-15",
    deliveryDate: "2023-09-15",
    amount: 4200,
    status: "Delivered",
    items: [
      { name: "Modular Sofa", quantity: 1, price: 2500, total: 2500 },
      { name: "Coffee Table", quantity: 1, price: 800, total: 800 },
      { name: "Floor Lamp", quantity: 3, price: 300, total: 900 }
    ]
  },
  {
    id: "PO-2023-002",
    vendor: "Artistic Lighting Solutions",
    project: "Corporate Office Revamp",
    date: "2023-08-20",
    deliveryDate: "2023-09-20",
    amount: 3600,
    status: "In Transit",
    items: [
      { name: "Pendant Lights", quantity: 6, price: 250, total: 1500 },
      { name: "Recessed Lights", quantity: 12, price: 100, total: 1200 },
      { name: "Wall Sconces", quantity: 6, price: 150, total: 900 }
    ]
  },
  {
    id: "PO-2023-003",
    vendor: "Premium Fabric Wholesalers",
    project: "Coastal Vacation Home",
    date: "2023-08-25",
    deliveryDate: "2023-09-25",
    amount: 1800,
    status: "Processing",
    items: [
      { name: "Upholstery Fabric", quantity: 20, price: 40, total: 800 },
      { name: "Drapery Material", quantity: 15, price: 35, total: 525 },
      { name: "Throw Pillows", quantity: 10, price: 45, total: 450 }
    ]
  },
  {
    id: "PO-2023-004",
    vendor: "Eco-Friendly Flooring Co.",
    project: "Modern Loft Redesign",
    date: "2023-09-01",
    deliveryDate: "2023-10-01",
    amount: 5500,
    status: "Processing",
    items: [
      { name: "Engineered Hardwood", quantity: 500, price: 8, total: 4000 },
      { name: "Underlayment", quantity: 500, price: 2, total: 1000 },
      { name: "Transition Strips", quantity: 10, price: 50, total: 500 }
    ]
  },
  {
    id: "PO-2023-005",
    vendor: "Custom Cabinetry Specialists",
    project: "Luxury Apartment Redesign",
    date: "2023-09-05",
    deliveryDate: "2023-10-15",
    amount: 8200,
    status: "Ordered",
    items: [
      { name: "Kitchen Cabinets", quantity: 1, price: 6000, total: 6000 },
      { name: "Bathroom Vanity", quantity: 2, price: 900, total: 1800 },
      { name: "Built-in Shelving", quantity: 1, price: 400, total: 400 }
    ]
  }
];

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  
  // Filter purchase orders based on search and status
  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-600";
      case "In Transit":
        return "bg-blue-100 text-blue-600";
      case "Processing":
        return "bg-amber-100 text-amber-600";
      case "Ordered":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered":
        return <CheckCircle size={14} className="mr-1" />;
      case "In Transit":
        return <TruckIcon size={14} className="mr-1" />;
      case "Processing":
        return <Clock size={14} className="mr-1" />;
      case "Ordered":
        return <ShoppingBag size={14} className="mr-1" />;
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-light mb-2">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage orders for materials, furniture, and fixtures</p>
          </div>
          <MotionButton variant="default" motion="subtle">
            <Plus size={18} className="mr-2" /> Create Purchase Order
          </MotionButton>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.1s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search purchase orders..."
              className="w-full rounded-lg border border-input bg-background px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter("All")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "All"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Filter size={16} />
              <span>All</span>
            </button>
            <button
              onClick={() => setStatusFilter("Ordered")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Ordered"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <ShoppingBag size={16} />
              <span>Ordered</span>
            </button>
            <button
              onClick={() => setStatusFilter("Processing")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Processing"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Clock size={16} />
              <span>Processing</span>
            </button>
            <button
              onClick={() => setStatusFilter("In Transit")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "In Transit"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <TruckIcon size={16} />
              <span>In Transit</span>
            </button>
            <button
              onClick={() => setStatusFilter("Delivered")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Delivered"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <CheckCircle size={16} />
              <span>Delivered</span>
            </button>
          </div>
        </div>

        {/* Purchase Orders */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in animation-delay-[0.2s]">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full">
              <GlassCard className="p-8 text-center">
                <ShoppingBag className="mx-auto mb-4 text-muted-foreground" size={48} />
                <h3 className="text-xl font-medium mb-2">No Purchase Orders Found</h3>
                <p className="text-muted-foreground mb-6">
                  No purchase orders match your current filters. Try a different search or status filter.
                </p>
                <MotionButton variant="default" motion="subtle">
                  <Plus size={18} className="mr-2" /> Create Purchase Order
                </MotionButton>
              </GlassCard>
            </div>
          ) : (
            filteredOrders.map(order => (
              <GlassCard 
                key={order.id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6 border-b border-border">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-lg mb-1">{order.id}</h3>
                      <p className="text-muted-foreground text-sm">
                        {order.project}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium inline-flex items-center",
                      getStatusBadge(order.status)
                    )}>
                      {getStatusIcon(order.status)}
                      {order.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Vendor</p>
                      <p className="font-medium truncate">{order.vendor}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Amount</p>
                      <p className="font-medium">{formatCurrency(order.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Order Date</p>
                      <p>{formatDate(order.date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                      <p>{formatDate(order.deliveryDate)}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Items</p>
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <div className="flex-1 truncate">
                            <span className="font-medium">{item.quantity}x</span> {item.name}
                          </div>
                          <span>{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-sm text-muted-foreground">
                          +{order.items.length - 2} more items
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-3 bg-secondary/30 flex justify-between items-center">
                  <span className="text-sm">{order.items.reduce((total, item) => total + item.quantity, 0)} items total</span>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                      <Download size={18} />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                      <Mail size={18} />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default PurchaseOrders;
