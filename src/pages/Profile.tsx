import React, { useEffect } from "react";
import PageContainer from "@/components/layout/PageContainer";
import DashboardHeader from "@/components/layout/DashboardHeader";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { getProfile, updateProfile, selectUser, selectSelectedCompany } from "@/redux/slices/authSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import ActionButton from "@/components/ui/ActionButton";

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
  newPassword?: string;
};

const Profile = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const selectedCompany = useAppSelector(selectSelectedCompany);
  const isCompanyAccount = Boolean((user as any)?.isCompany);

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
      newPassword: "",
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
      newPassword: "",
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
      if (values.newPassword) payload.newPassword = values.newPassword;
    } else {
      // Personal updates
      payload.firstName = values.firstName;
      payload.lastName = values.lastName;
      payload.phone = values.phone;
      payload.address = values.address;
      if (values.accountEmail) payload.email = values.accountEmail;
      if (values.newPassword) payload.newPassword = values.newPassword;
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

    await dispatch(updateProfile(payload));
  };

  return (
    <PageContainer>
      <div className="space-y-4 sm:space-y-6 w-full min-w-0">
        <DashboardHeader />
        <div className="mb-2 sm:hidden">
          <h1 className="font-semibold leading-[100%] text-gray-900">Profile</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal and company details</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal details (hidden for company accounts) */}
                {!isCompanyAccount && (
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}
                {!isCompanyAccount && (
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}
                {!isCompanyAccount && (
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}
                {!isCompanyAccount && (
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                )}

                {/* Company details for admin users or company accounts */}
                {(isAdminLike || isCompanyAccount) && (
                  <>
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Email" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Company Address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Divider */}
                <div className="md:col-span-2 border-t my-4" />

                {/* Account Settings: email and password (visible for all) */}
                <FormField
                  control={form.control}
                  name="accountEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input placeholder="New Password" type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end">
                  <ActionButton variant="primary" text="Save Changes" type="submit" />
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Profile;