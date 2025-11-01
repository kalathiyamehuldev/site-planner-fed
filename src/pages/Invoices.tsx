
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Mail, 
  FileText, 
  CreditCard, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  Receipt
} from "lucide-react";

// Mock data for invoices
const mockInvoices = [
  {
    id: "INV-2023-001",
    project: "Modern Loft Redesign",
    client: "Jane Cooper",
    amount: 4500,
    date: "2023-08-15",
    dueDate: "2023-08-30",
    status: "Paid",
    items: [
      { description: "Design Consultation", hours: 6, rate: 150, amount: 900 },
      { description: "Floor Plan Drafting", hours: 12, rate: 200, amount: 2400 },
      { description: "Material Selection", hours: 8, rate: 150, amount: 1200 }
    ]
  },
  {
    id: "INV-2023-002",
    project: "Coastal Vacation Home",
    client: "Michael Scott",
    amount: 3200,
    date: "2023-08-20",
    dueDate: "2023-09-05",
    status: "Pending",
    items: [
      { description: "Initial Consultation", hours: 4, rate: 150, amount: 600 },
      { description: "Concept Development", hours: 10, rate: 200, amount: 2000 },
      { description: "Furniture Sourcing", hours: 4, rate: 150, amount: 600 }
    ]
  },
  {
    id: "INV-2023-003",
    project: "Corporate Office Revamp",
    client: "Acme Corp",
    amount: 8500,
    date: "2023-08-25",
    dueDate: "2023-09-10",
    status: "Overdue",
    items: [
      { description: "Space Planning", hours: 16, rate: 200, amount: 3200 },
      { description: "3D Rendering", hours: 20, rate: 250, amount: 5000 },
      { description: "Material Samples", hours: 2, rate: 150, amount: 300 }
    ]
  },
  {
    id: "INV-2023-004",
    project: "Modern Loft Redesign",
    client: "Jane Cooper",
    amount: 2800,
    date: "2023-09-05",
    dueDate: "2023-09-20",
    status: "Draft",
    items: [
      { description: "Revision Consultation", hours: 4, rate: 150, amount: 600 },
      { description: "Updated Drawings", hours: 8, rate: 200, amount: 1600 },
      { description: "Additional Material Selection", hours: 4, rate: 150, amount: 600 }
    ]
  },
  {
    id: "INV-2023-005",
    project: "Luxury Apartment Redesign",
    client: "David Miller",
    amount: 5200,
    date: "2023-09-10",
    dueDate: "2023-09-25",
    status: "Pending",
    items: [
      { description: "Design Consultation", hours: 8, rate: 150, amount: 1200 },
      { description: "Custom Furniture Design", hours: 16, rate: 200, amount: 3200 },
      { description: "Lighting Plan", hours: 8, rate: 100, amount: 800 }
    ]
  },
  {
    id: "INV-2023-006",
    project: "Restaurant Interior",
    client: "Fine Dining Inc.",
    amount: 7500,
    date: "2023-09-15",
    dueDate: "2023-09-30",
    status: "Paid",
    items: [
      { description: "Spatial Planning", hours: 12, rate: 200, amount: 2400 },
      { description: "Custom Fixture Design", hours: 18, rate: 250, amount: 4500 },
      { description: "Material & Finish Selection", hours: 4, rate: 150, amount: 600 }
    ]
  }
];

const Invoices = () => {
  const [invoices, setInvoices] = useState(mockInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  
  // Filter invoices based on search and status
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
  
  // Calculate total, pending, and paid amounts
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = invoices
    .filter(invoice => invoice.status === "Paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = invoices
    .filter(invoice => invoice.status === "Pending" || invoice.status === "Overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  
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
      case "Paid":
        return "bg-green-100 text-green-600";
      case "Pending":
        return "bg-blue-100 text-blue-600";
      case "Overdue":
        return "bg-red-100 text-red-600";
      case "Draft":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle size={14} className="mr-1" />;
      case "Pending":
        return <Clock size={14} className="mr-1" />;
      case "Overdue":
        return <AlertCircle size={14} className="mr-1" />;
      case "Draft":
        return <FileText size={14} className="mr-1" />;
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
            <h1 className="text-3xl font-light mb-2">Invoices</h1>
            <p className="text-muted-foreground">Manage and track project invoices</p>
          </div>
          <ActionButton variant="primary" motion="subtle" text="Create Invoice" leftIcon={<Plus size={18} />} />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in animation-delay-[0.1s]">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <Receipt size={20} className="text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium text-sm">Total Invoiced</h3>
            </div>
            <p className="text-2xl font-light">{formatCurrency(totalAmount)}</p>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">↑ 15%</span> from last month
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <CheckCircle size={20} className="text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium text-sm">Paid</h3>
            </div>
            <p className="text-2xl font-light">{formatCurrency(paidAmount)}</p>
            <div className="mt-2 text-sm">
              <span className="text-green-600 font-medium">{Math.round((paidAmount / totalAmount) * 100)}%</span> of total invoiced
            </div>
          </GlassCard>
          
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full w-10 h-10 flex items-center justify-center bg-primary/10">
                <Clock size={20} className="text-primary" />
              </div>
              <h3 className="text-muted-foreground font-medium text-sm">Outstanding</h3>
            </div>
            <p className="text-2xl font-light">{formatCurrency(pendingAmount)}</p>
            <div className="mt-2 text-sm">
              <span className="text-amber-600 font-medium">{Math.round((pendingAmount / totalAmount) * 100)}%</span> of total invoiced
            </div>
          </GlassCard>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 animate-fade-in animation-delay-[0.2s]">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              placeholder="Search invoices..."
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
              onClick={() => setStatusFilter("Paid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Paid"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <CheckCircle size={16} />
              <span>Paid</span>
            </button>
            <button
              onClick={() => setStatusFilter("Pending")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Pending"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Clock size={16} />
              <span>Pending</span>
            </button>
            <button
              onClick={() => setStatusFilter("Overdue")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Overdue"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <AlertCircle size={16} />
              <span>Overdue</span>
            </button>
            <button
              onClick={() => setStatusFilter("Draft")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                statusFilter === "Draft"
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <FileText size={16} />
              <span>Draft</span>
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <GlassCard className="animate-fade-in animation-delay-[0.3s]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-muted-foreground">Invoice #</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Client</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Project</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Due Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
                      <h3 className="text-xl font-medium mb-2">No Invoices Found</h3>
                      <p className="text-muted-foreground mb-6">
                        No invoices match your current filters. Try a different search or status filter.
                      </p>
                      <ActionButton variant="primary" motion="subtle" text="Create New Invoice" leftIcon={<Plus size={18} />} />
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      className={cn(
                        "border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer",
                        selectedInvoice === invoice.id && "bg-secondary/50"
                      )}
                      onClick={() => setSelectedInvoice(invoice.id === selectedInvoice ? null : invoice.id)}
                    >
                      <td className="p-4 font-medium">{invoice.id}</td>
                      <td className="p-4">{invoice.client}</td>
                      <td className="p-4">{invoice.project}</td>
                      <td className="p-4">{formatDate(invoice.date)}</td>
                      <td className="p-4">{formatDate(invoice.dueDate)}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(invoice.amount)}</td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full font-medium inline-flex items-center",
                            getStatusBadge(invoice.status)
                          )}>
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end items-center gap-2">
                          <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                            <Download size={16} />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-primary">
                            <Mail size={16} />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Selected Invoice Details */}
        {selectedInvoice && (
          <GlassCard className="p-6 animate-scale-in">
            {invoices
              .filter(invoice => invoice.id === selectedInvoice)
              .map(invoice => (
                <div key={invoice.id}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div>
                      <h2 className="text-2xl font-medium mb-1">{invoice.id}</h2>
                      <p className="text-muted-foreground">
                        {invoice.project} • {invoice.client}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <ActionButton variant="secondary" motion="subtle" text="Download PDF" leftIcon={<Download size={16} />} />
                      <ActionButton variant="secondary" motion="subtle" text="Send to Client" leftIcon={<Mail size={16} />} />
                      {invoice.status === "Pending" || invoice.status === "Overdue" ? (
                        <ActionButton variant="primary" motion="subtle" text="Mark as Paid" leftIcon={<CheckCircle size={16} />} />
                      ) : null}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-secondary/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Issue Date</p>
                      <p className="font-medium">{formatDate(invoice.date)}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                      <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Status</p>
                      <p>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full font-medium inline-flex items-center",
                          getStatusBadge(invoice.status)
                        )}>
                          {getStatusIcon(invoice.status)}
                          {invoice.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Line Items</h3>
                    <div className="bg-muted/30 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="text-left p-3 font-medium text-muted-foreground">Description</th>
                            <th className="text-right p-3 font-medium text-muted-foreground">Hours</th>
                            <th className="text-right p-3 font-medium text-muted-foreground">Rate</th>
                            <th className="text-right p-3 font-medium text-muted-foreground">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, index) => (
                            <tr key={index} className="border-b border-border last:border-0">
                              <td className="p-3">{item.description}</td>
                              <td className="p-3 text-right">{item.hours}</td>
                              <td className="p-3 text-right">{formatCurrency(item.rate)}</td>
                              <td className="p-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-secondary/30">
                          <tr>
                            <td colSpan={3} className="p-3 text-right font-medium">Total</td>
                            <td className="p-3 text-right font-medium">{formatCurrency(invoice.amount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                  
                  <div className="border-t border-border pt-6 flex justify-end">
                    <ActionButton variant="secondary" motion="subtle" onClick={() => setSelectedInvoice(null)} text="Close Details" />
                  </div>
                </div>
              ))}
          </GlassCard>
        )}
      </div>
    </PageContainer>
  );
};

export default Invoices;
