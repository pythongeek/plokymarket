'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Ticket,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Loader2,
  Send
} from 'lucide-react';
import { userManagementService } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface UserSupportViewProps {
  userId: string;
  tickets: any[];
}

export function UserSupportView({ userId, tickets }: UserSupportViewProps) {
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    
    setProcessing(true);
    try {
      await userManagementService.addTicketMessage(
        selectedTicket.id,
        newMessage,
        isInternalNote
      );
      setNewMessage('');
      // Refresh ticket data
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'open':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <Ticket className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-blue-500',
      low: 'bg-gray-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Support Tickets</h3>
      </div>

      {tickets.length === 0 ? (
        <Card className="p-8 text-center">
          <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-lg font-medium mb-2">No Tickets</h3>
          <p className="text-sm text-muted-foreground">
            This user has not submitted any support tickets.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card 
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getStatusIcon(ticket.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{ticket.subject}</p>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.ticket_number} • {ticket.category}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Created {new Date(ticket.created_at).toLocaleDateString()}
                          {ticket.assigned_to && ` • Assigned to ${ticket.assigned_to.full_name}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={ticket.status === 'resolved' ? 'default' : 'outline'}>
                      {ticket.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            <DialogDescription>
              {selectedTicket?.ticket_number} • {selectedTicket?.category}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Messages */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* Mock messages for now */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium">User</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedTicket?.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{selectedTicket?.description}</p>
              </div>
            </div>

            {/* Reply Box */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInternalNote}
                    onChange={(e) => setIsInternalNote(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Internal note (user won't see)</span>
                </Label>
              </div>
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSendMessage}
                  disabled={processing || !newMessage.trim()}
                >
                  {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
