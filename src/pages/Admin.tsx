import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Building2 } from 'lucide-react';
import MemberManagement from '@/components/admin/MemberManagement';
import VendorManagement from '@/components/admin/VendorManagement';
import CustomerManagement from '@/components/admin/CustomerManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('members');
  
  // Get selected company ID from localStorage
  const selectedCompany = localStorage.getItem('selectedCompany');
  const companyId = selectedCompany ? JSON.parse(selectedCompany).id : null;

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">No Company Selected</CardTitle>
            <CardDescription className="text-center">
              Please select a company to access admin features.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          Manage your company's members, vendors, and customers
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Member Management
              </CardTitle>
              <CardDescription>
                Manage company members, their roles, and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MemberManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Vendor Management
              </CardTitle>
              <CardDescription>
                Manage your company's vendors and supplier relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VendorManagement />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Customer Management
              </CardTitle>
              <CardDescription>
                Manage your company's customers and client relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerManagement />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;