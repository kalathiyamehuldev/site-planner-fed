import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Building2 } from 'lucide-react';
import MemberManagement from '@/components/admin/MemberManagement';
import VendorManagement from '@/components/admin/VendorManagement';
import CustomerManagement from '@/components/admin/CustomerManagement';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';

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
    <PageContainer className="space-y-6">
      <PageHeader 
        title="Admin Panel" 
        subtitle="Manage your company's members, vendors, and customers"
      />
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4 md:mb-6 bg-transparent border-0 rounded-none p-1 gap-1 sm:gap-2">
              <TabsTrigger 
                value="members" 
                className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-100 border-0 rounded-full px-2 sm:px-4 md:px-6 py-2 md:py-3 text-xs sm:text-sm md:text-base text-gray-600 hover:text-blue-600 hover:bg-blue-100 data-[state=active]:text-white data-[state=active]:bg-blue-600 transition-all duration-200 font-medium overflow-hidden"
              >
                <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">Members</span>
              </TabsTrigger>
              <TabsTrigger 
                value="vendors" 
                className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-100 border-0 rounded-full px-2 sm:px-4 md:px-6 py-2 md:py-3 text-xs sm:text-sm md:text-base text-gray-600 hover:text-green-600 hover:bg-green-100 data-[state=active]:text-white data-[state=active]:bg-green-600 transition-all duration-200 font-medium overflow-hidden"
              >
                <Building2 className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">Vendors</span>
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="flex items-center justify-center gap-1 sm:gap-2 bg-gray-100 border-0 rounded-full px-2 sm:px-4 md:px-6 py-2 md:py-3 text-xs sm:text-sm md:text-base text-gray-600 hover:text-purple-600 hover:bg-purple-100 data-[state=active]:text-white data-[state=active]:bg-purple-600 transition-all duration-200 font-medium overflow-hidden"
              >
                <UserCheck className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                <span className="truncate">Customers</span>
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
    </PageContainer>
  );
};

export default Admin;
