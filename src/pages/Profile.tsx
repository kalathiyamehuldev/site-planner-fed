import React, { useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getProfile, updateProfile, selectUser, selectSelectedCompany } from "@/redux/slices/authSlice";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import ActionButton from "@/components/ui/ActionButton";
import { User, Building, Mail, Phone, MapPin, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
type ProfileFormValues = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  accountEmail?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

const Profile = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const isCompanyAccount = Boolean((user as any)?.isCompany);
  const { toast } = useToast();

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  // Helpers: UAE phone validation (accepts +971 or 0 prefix), allow spaces/dashes
  const sanitizePhone = (val: string) => (val || "").replace(/[^\d]/g, "");
  const UAE_PHONE_REGEX = /^(?:971|0)(?:5[0-9]{8}|[2-9][0-9]{7})$/;

  // Build Yup schema depending on account type, and ensure correct ObjectSchema type
  const profileSchema: yup.ObjectSchema<ProfileFormValues> = (isCompanyAccount
    ? yup.object({
        // Company account: validate company fields if provided
        companyName: yup
          .string()
          .trim()
          .max(100, "Company name must be at most 100 characters")
          .optional()
          .test(
            "company-letters-only",
            "Company name must contain only letters (at least one)",
            (val) => !val || /^[A-Za-z][A-Za-z\s'-]*$/.test(val)
          ),
        companyEmail: yup
          .string()
          .trim()
          .max(254, "Company email must be at most 254 characters")
          .optional()
          .email("Please enter a valid company email"),
        companyPhone: yup
          .string()
          .trim()
          .max(20, "Company phone must be at most 20 characters")
          .optional(),
          // .test(
          //   "uae-phone",
          //   "Please enter a valid UAE phone number",
          //   (val) => !val || UAE_PHONE_REGEX.test(sanitizePhone(val))
          // ),
        companyAddress: yup.string().trim().max(160, "Company address must be at most 160 characters").optional(),
        // Personal details hidden for company account; still constrain lengths
        firstName: yup
          .string()
          .trim()
          .max(50, "First name must be at most 50 characters")
          .optional()
          .test(
            "first-letters-only",
            "First name must contain only letters (at least one)",
            (val) => !val || /^[A-Za-z][A-Za-z\s'-]*$/.test(val)
          ),
        lastName: yup
          .string()
          .trim()
          .max(50, "Last name must be at most 50 characters")
          .optional()
          .test(
            "last-letters-only",
            "Last name must contain only letters (at least one)",
            (val) => !val || /^[A-Za-z][A-Za-z\s'-]*$/.test(val)
          ),
        phone: yup
          .string()
          .trim()
          .max(20, "Phone must be at most 20 characters")
          .optional()
          // .test(
          //   "uae-phone",
          //   "Please enter a valid UAE phone number",
          //   (val) => !val || UAE_PHONE_REGEX.test(sanitizePhone(val))
          // )
          ,
        address: yup.string().trim().max(160, "Address must be at most 160 characters").optional(),
        // Account settings
        accountEmail: yup
          .string()
          .trim()
          .max(100, "Email must be at most 100 characters")
          .email("Please enter a valid email address")
          .required("Email is required"),
        currentPassword: yup
          .string()
          .trim()
          .max(20, "Current Password must be at most 20 characters")
          .optional(),
        newPassword: yup
          .string()
          .trim()
          .max(20, "New Password must be at most 20 characters")
          .optional()
          .test(
            "min-8",
            "New Password must be at least 8 characters",
            (val) => !val || val.length >= 8
          ),
        confirmNewPassword: yup
          .string()
          .trim()
          .max(20, "Confirm Password must be at most 20 characters")
          .optional()
      })
    : yup.object({
        // Personal details required for non-company accounts
        firstName: yup
          .string()
          .trim()
          .min(1, "First name is required")
          .max(50, "First name must be at most 50 characters")
          .matches(/^[A-Za-z][A-Za-z\s'-]*$/, "First name must contain only letters (at least one)"),
        lastName: yup
          .string()
          .trim()
          .min(1, "Last name is required")
          .max(50, "Last name must be at most 50 characters")
          .matches(/^[A-Za-z][A-Za-z\s'-]*$/, "Last name must contain only letters (at least one)"),
        phone: yup
          .string()
          .trim()
          .max(20, "Phone must be at most 20 characters")
          .optional()
          // .test(
          //   "uae-phone",
          //   "Please enter a valid UAE phone number",
          //   (val) => !val || UAE_PHONE_REGEX.test(sanitizePhone(val))
          // )
          ,
        address: yup.string().trim().max(200, "Address must be at most 200 characters").optional(),
        // Company fields optional; validated if admin-like adds them
        companyName: yup.string().trim().max(30, "Company name must be at most 30 characters").optional(),
        companyEmail: yup
          .string()
          .trim()
          .max(254, "Company email must be at most 254 characters")
          .optional()
          .email("Please enter a valid company email"),
        companyPhone: yup
          .string()
          .trim()
          .max(20, "Company phone must be at most 20 characters")
          .optional()
          // .test(
          //   "uae-phone",
          //   "Please enter a valid UAE phone number",
          //   (val) => !val || UAE_PHONE_REGEX.test(sanitizePhone(val))
          // )
          ,
        companyAddress: yup.string().trim().max(160, "Company address must be at most 160 characters").optional(),
        // Account settings
        accountEmail: yup
          .string()
          .trim()
          .max(254, "Email must be at most 254 characters")
          .email("Please enter a valid email address")
          .required("Email is required"),
        currentPassword: yup
          .string()
          .trim()
          .max(20, "Current Password must be at most 20 characters")
          .optional(),
        newPassword: yup
          .string()
          .trim()
          .max(20, "New Password must be at most 20 characters")
          .optional()
          .test(
            "min-8",
            "New Password must be at least 8 characters",
            (val) => !val || val.length >= 8
          ),
        confirmNewPassword: yup
          .string()
          .trim()
          .max(20, "Confirm Password must be at most 20 characters")
          .optional()
      })) as yup.ObjectSchema<ProfileFormValues>;

  const form = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: selectedCompany?.phone || user?.company?.phone || "",
      address: selectedCompany?.address || user?.company?.address || "",
      companyName: selectedCompany?.name || user?.company?.name || "",
      companyEmail: selectedCompany?.email || user?.company?.email || "",
      companyPhone: selectedCompany?.phone || user?.company?.phone || "",
      companyAddress: selectedCompany?.address || user?.company?.address || "",
      accountEmail: user?.email || "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    },
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: selectedCompany?.phone || user?.company?.phone || "",
      address: selectedCompany?.address || user?.company?.address || "",
      companyName: selectedCompany?.name || user?.company?.name || "",
      companyEmail: selectedCompany?.email || user?.company?.email || "",
      companyPhone: selectedCompany?.phone || user?.company?.phone || "",
      companyAddress: selectedCompany?.address || user?.company?.address || "",
      accountEmail: user?.email || "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    }
  });

  const isAdminLike = (user?.role?.name || "").toUpperCase() === "ADMIN" || (user?.role?.name || "").toUpperCase() === "SUPER_ADMIN";

  const onSubmit = async (values: ProfileFormValues) => {
    const payload: any = {};
    // If logged in as company account, only update company details
    if (isCompanyAccount) {
      payload.company = {
        name: values.companyName,
        email: values.companyEmail,
        phone: values.companyPhone,
        address: values.companyAddress,
      };
      // Company accounts can also update admin credentials
      if (values.accountEmail) payload.email = values.accountEmail;
      if (values.newPassword) {
        if (values.newPassword !== values.confirmNewPassword) {
          toast({ title: "Error", description: "New password and confirm password do not match", variant: "destructive" });
          return;
        }
        payload.newPassword = values.newPassword;
        payload.currentPassword = values.currentPassword;
      }
    } else {
      // Personal updates
      payload.firstName = values.firstName;
      payload.lastName = values.lastName;
      payload.phone = values.phone;
      payload.address = values.address;
      if (values.accountEmail) payload.email = values.accountEmail;
      if (values.newPassword) {
        if (values.newPassword !== values.confirmNewPassword) {
          toast({ title: "Error", description: "New password and confirm password do not match", variant: "destructive" });
          return;
        }
        payload.newPassword = values.newPassword;
        payload.currentPassword = values.currentPassword;
      }
      // Admin-like users may also update company profile
      if (isAdminLike) {
        payload.company = {
          name: values.companyName,
          email: values.companyEmail,
          phone: values.companyPhone,
          address: values.companyAddress,
        };
      }
    }

    
    try {
      await dispatch(updateProfile(payload)).unwrap();
    } catch (error) {}
  };

  return (
    <PageContainer>
      <div className="md:space-y-6 w-full min-w-0">
        <PageHeader title="Profile Settings" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Overview Card */}
          <Card className="lg:col-span-1 shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <CardTitle>
                <h2>{isCompanyAccount ? (selectedCompany?.name || "Company Account") : `${user?.firstName} ${user?.lastName}`}</h2>
              </CardTitle>
              <CardDescription>
                <p>{isCompanyAccount ? "Company Administrator" : user?.role?.name || "User"}</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  <p>{user?.email}</p>
                </div>
                {(selectedCompany?.phone || user?.company?.phone) && (
                  <div className="flex items-center justify-center gap-2">
                    <Phone className="w-4 h-4" />
                    <p>{selectedCompany?.phone || user?.company?.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Profile Form Card */}
          <Card className="lg:col-span-2 shadow-lg border-0">
            <CardHeader>
              <CardTitle className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                <h1>Edit Profile</h1>
              </CardTitle>
              <CardDescription>
                <p>Update your personal and company details</p>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  {/* Personal Details Section */}
                  {!isCompanyAccount && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-x-2 pb-3 border-b-2 border-blue-100">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3>Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>First Name</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter your first name" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <User className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Last Name</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter your last name" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <User className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Phone Number</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter your phone number" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Address</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter your address" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Company Details Section */}
                  {(isAdminLike || isCompanyAccount) && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-x-2 pb-3 border-b-2 border-green-100">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Building className="h-6 w-6 text-green-600" />
                        </div>
                        <h3>Company Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="companyName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Company Name</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter company name" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Building className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="companyEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Company Email</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter company email" 
                                    type="email" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="companyPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Company Phone</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter company phone" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="companyAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel><h5>Company Address</h5></FormLabel>
                              <FormControl>
                                <div className="relative flex items-center">
                                  <Input 
                                    placeholder="Enter company address" 
                                    {...field} 
                                    className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                    style={{ paddingRight: '36px' }}
                                  />
                                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </FormControl>
                              <FormMessage className="text-red-500" />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {/* Account Settings Section */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-x-2 pb-3 border-b-2 border-purple-100">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Lock className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3>Account Settings</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="accountEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1">
                              <h5>Account Email</h5>
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative flex items-center">
                                <Input 
                                  placeholder="Enter account email" 
                                  type="email" 
                                  {...field} 
                                  className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                  style={{ paddingRight: '36px' }}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <Mail className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel><h5>Current Password</h5></FormLabel>
                            <FormControl>
                              <div className="relative flex items-center">
                                <Input 
                                  placeholder="Enter current password" 
                                  type="password" 
                                  {...field} 
                                  className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                  style={{ paddingRight: '36px' }}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel><h5>New Password (Optional)</h5></FormLabel>
                            <FormControl>
                              <div className="relative flex items-center">
                                <Input 
                                  placeholder="Enter new password" 
                                  type="password" 
                                  {...field} 
                                  className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                  style={{ paddingRight: '36px' }}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmNewPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel><h5>Confirm New Password</h5></FormLabel>
                            <FormControl>
                              <div className="relative flex items-center">
                                <Input 
                                  placeholder="Confirm new password" 
                                  type="password" 
                                  {...field} 
                                  className="pl-3 pr-3 py-2 text-xs transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-200 flex-1"
                                  style={{ paddingRight: '36px' }}
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                  <Lock className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage className="text-red-500" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <ActionButton 
                      variant="primary" 
                      text="Save Changes" 
                      type="submit" 
                      className="px-8 py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

export default Profile;
