import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  MessageSquare, Send, Inbox, SendHorizontal, 
  Mail, CheckCircle2, Clock, AlertCircle
} from 'lucide-react';
import api from '../config/api';
import { toast } from 'react-hot-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  recipient_type: string;
  subject: string;
  message_body: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export default function InternalMessages() {
  const [inbox, setInbox] = useState<Message[]>([]);
  const [sent, setSent] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Compose message state
  const [recipientType, setRecipientType] = useState('individual');
  const [subject, setSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [priority, setPriority] = useState('normal');

  useEffect(() => {
    loadMessages();
    loadUnreadCount();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const inboxResponse = await api.get('/api/messages/inbox');
      setInbox(inboxResponse.data.messages || []);
      
      const sentResponse = await api.get('/api/messages/sent');
      setSent(sentResponse.data.messages || []);
    } catch (error: any) {
      toast.error('Failed to load messages');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/api/messages/unread-count');
      setUnreadCount(response.data.unread_count || 0);
    } catch (error: any) {
      console.error('Failed to load unread count:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await api.post(`/api/messages/${messageId}/read`);
      loadMessages();
      loadUnreadCount();
      toast.success('Message marked as read');
    } catch (error: any) {
      toast.error('Failed to mark message as read');
    }
  };

  const sendMessage = async () => {
    if (!subject || !messageBody) {
      toast.error('Subject and message are required');
      return;
    }

    try {
      await api.post('/api/messages/send', {
        recipient_type: recipientType,
        subject,
        message_body: messageBody,
        priority
      });
      
      toast.success('Message sent successfully');
      setSubject('');
      setMessageBody('');
      setRecipientType('individual');
      setPriority('normal');
      setActiveTab('sent');
      loadMessages();
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error(error);
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      normal: 'bg-blue-100 text-blue-700 border-blue-200',
      low: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[priority as keyof typeof colors] || colors.normal;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Internal Messages</h1>
          <p className="text-gray-500 mt-1">Employee communication system</p>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500">
            {unreadCount} unread
          </Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'inbox'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Inbox {unreadCount > 0 && `(${unreadCount})`}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'sent'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <SendHorizontal className="h-4 w-4" />
            Sent
          </div>
        </button>
        <button
          onClick={() => setActiveTab('compose')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'compose'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose
          </div>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'inbox' && (
        <Card>
          <CardHeader>
            <CardTitle>Inbox</CardTitle>
            <CardDescription>Your received messages</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : inbox.length > 0 ? (
              <div className="space-y-2">
                {inbox.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 border rounded-lg ${
                      !msg.is_read ? 'bg-blue-50 border-blue-200 font-medium' : 'bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{msg.subject}</h3>
                          <Badge className={getPriorityBadge(msg.priority)}>
                            {msg.priority}
                          </Badge>
                          {!msg.is_read && (
                            <Badge variant="default" className="bg-blue-500">New</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{msg.message_body}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          {msg.is_read && msg.read_at && (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              Read {new Date(msg.read_at).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {!msg.is_read && (
                        <Button size="sm" variant="outline" onClick={() => markAsRead(msg.id)}>
                          Mark as Read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No messages</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'sent' && (
        <Card>
          <CardHeader>
            <CardTitle>Sent Messages</CardTitle>
            <CardDescription>Messages you've sent</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : sent.length > 0 ? (
              <div className="space-y-2">
                {sent.map((msg) => (
                  <div key={msg.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{msg.subject}</h3>
                          <Badge className={getPriorityBadge(msg.priority)}>
                            {msg.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{msg.message_body}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                          <span>To: {msg.recipient_type === 'all' ? 'All Staff' : msg.recipient_type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">No sent messages</div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'compose' && (
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
            <CardDescription>Send a message to team members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Recipient</label>
                <Select value={recipientType} onValueChange={setRecipientType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="all">All Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter message subject"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>

              <Button onClick={sendMessage} className="w-full gap-2">
                <Send className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

