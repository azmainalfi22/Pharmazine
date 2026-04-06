import { useState, useEffect } from "react";
import { Bell, Calendar, Phone, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { API_CONFIG, getAuthHeaders } from "@/config/api";
import { logger } from "@/utils/logger";

interface RefillReminder {
  id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  product_name: string;
  refill_date: string;
}

export default function RefillReminders() {
  const [reminders, setReminders] = useState<RefillReminder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDueReminders();
  }, []);

  const loadDueReminders = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_CONFIG.API_ROOT}/pharmacy/enhanced/refill-reminders/due`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReminders(data);
        toast.success(`Found ${data.length} due refill reminders`);
      }
    } catch (error) {
      logger.error("Error loading reminders:", error);
      toast.error("Error loading refill reminders");
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (reminderId: string, phone: string) => {
    toast.info(`Reminder sent to ${phone} (Feature in development)`);
    // Implementation for SMS/Email notification would go here
  };

  const markAsCompleted = async (reminderId: string) => {
    toast.success("Reminder marked as completed");
    setReminders(reminders.filter((r) => r.id !== reminderId));
  };

  const getUrgencyBadge = (refillDate: string) => {
    const today = new Date();
    const dueDate = new Date(refillDate);
    const daysUntil = Math.floor(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0) {
      return <Badge variant="destructive">OVERDUE</Badge>;
    } else if (daysUntil === 0) {
      return <Badge variant="warning">TODAY</Badge>;
    } else if (daysUntil <= 3) {
      return <Badge variant="warning">{daysUntil} days</Badge>;
    } else {
      return <Badge variant="default">{daysUntil} days</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Refill Reminders</h1>
          <p className="text-gray-600 mt-1">
            Manage and send medication refill reminders
          </p>
        </div>
        <Button onClick={loadDueReminders} disabled={loading}>
          <Bell className="w-4 h-4 mr-2" />
          {loading ? "Loading..." : "Refresh"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Due</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{reminders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {
                reminders.filter((r) =>
                  isBefore(new Date(r.refill_date), new Date())
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due Today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {
                reminders.filter(
                  (r) =>
                    format(new Date(r.refill_date), "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                ).length
              }
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Next 7 Days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {
                reminders.filter((r) =>
                  isBefore(new Date(r.refill_date), addDays(new Date(), 7))
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reminders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Due Refill Reminders</CardTitle>
          <CardDescription>
            Customers who need medication refills
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No Due Reminders</p>
              <p className="text-sm">All customers are up to date!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Refill Date</TableHead>
                  <TableHead>Urgency</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">
                      {reminder.customer_name}
                    </TableCell>
                    <TableCell>{reminder.product_name}</TableCell>
                    <TableCell>
                      {format(new Date(reminder.refill_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      {getUrgencyBadge(reminder.refill_date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{reminder.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            sendReminder(reminder.id, reminder.phone)
                          }
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Send
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => markAsCompleted(reminder.id)}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Mark Done
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            • Refill reminders are automatically created when chronic
            medications are dispensed
          </p>
          <p>
            • Customers receive notifications 7 days before their refill date
          </p>
          <p>• SMS and Email notifications can be configured in settings</p>
          <p>
            • Mark reminders as complete when customers refill their medications
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
