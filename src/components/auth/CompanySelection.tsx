import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCompany } from "@/redux/slices/authSlice";
import ActionButton from "@/components/ui/ActionButton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building } from "lucide-react";

const CompanySelection = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { availableCompanies, isLoading, user } = useAppSelector((state) => state.auth);
  const [selectedCompanyId, setSelectedCompanyId] = React.useState<string>("");

  const handleCompanySelect = async () => {
    if (selectedCompanyId) {
      const result = await dispatch(selectCompany({ companyId: selectedCompanyId }));
      if (selectCompany.fulfilled.match(result)) {
        navigate("/");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Company</CardTitle>
          <CardDescription>
            Welcome {user?.firstName}! Please select a company to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {availableCompanies.map((availableCompany) => (
              <div
                key={availableCompany.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedCompanyId === availableCompany.id
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedCompanyId(availableCompany.id)}
              >
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-medium">{availableCompany.name}</h3>
                    <p className="text-sm text-gray-500">
                      {availableCompany.email}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ActionButton
            variant="primary"
            motion="subtle"
            onClick={handleCompanySelect}
            className="w-full"
            disabled={!selectedCompanyId || isLoading}
            text={isLoading ? "Selecting..." : "Continue"}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanySelection;