
import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { GlassCard } from "@/components/ui/glass-card";
import ActionButton from "@/components/ui/ActionButton";
import { cn } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Filter, 
  ShoppingBag, 
  TruckIcon, 
  PackageCheck, 
  Clock, 
  AlertCircle,
  FileText,
  Building
} from "lucide-react";

const ProcurementHub = () => {
  return (
    <PageContainer>
      <div className="space-y-8">
        {/* Header */}
        <PageHeader 
          title="Procurement Hub" 
          subtitle="Manage your materials, furniture, and vendor orders"
        >
          <ActionButton 
            variant="primary" 
            motion="subtle"
            text="Create Order"
            leftIcon={<Plus size={18} />}
          />
        </PageHeader>

        {/* Coming Soon Message */}
        <GlassCard className="p-12 text-center animate-scale-in">
          <ShoppingBag className="mx-auto mb-4 text-primary" size={64} />
          <h2 className="text-2xl font-medium mb-3">Procurement Hub Coming Soon</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're currently building our procurement management system to help you track orders, manage vendors, and streamline your purchasing workflow.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-secondary/30 p-6 rounded-lg text-center">
              <TruckIcon className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium mb-1">Order Tracking</h3>
              <p className="text-sm text-muted-foreground">Track orders from placement to delivery</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-lg text-center">
              <Building className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium mb-1">Vendor Management</h3>
              <p className="text-sm text-muted-foreground">Manage all your suppliers in one place</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-lg text-center">
              <PackageCheck className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium mb-1">Item Catalog</h3>
              <p className="text-sm text-muted-foreground">Create a catalog of frequently purchased items</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-lg text-center">
              <FileText className="mx-auto mb-3 text-primary" size={32} />
              <h3 className="font-medium mb-1">Purchase Orders</h3>
              <p className="text-sm text-muted-foreground">Generate and manage purchase orders</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageContainer>
  );
};

export default ProcurementHub;
