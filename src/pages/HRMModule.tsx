import { useState } from "react";
import { Plus, Users, Calendar, DollarSign, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function HRMModule() {
  const [activeTab, setActiveTab] = useState("employees");

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="pharmacy-header">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Human Resource Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage employees, attendance, payroll, and leaves
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="employees"><Users className="w-4 h-4 mr-2" />Employees</TabsTrigger>
          <TabsTrigger value="attendance"><Calendar className="w-4 h-4 mr-2" />Attendance</TabsTrigger>
          <TabsTrigger value="payroll"><DollarSign className="w-4 h-4 mr-2" />Payroll</TabsTrigger>
          <TabsTrigger value="leaves"><FileText className="w-4 h-4 mr-2" />Leaves</TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Employees</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Employee management
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Attendance</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Attendance tracking
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Payroll</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Payroll processing
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaves">
          <Card className="pharmacy-card">
            <CardHeader><CardTitle>Leave Management</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Leave applications and approvals
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

