import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Home, 
  MessageSquare,
  Calendar,
  User,
  Send,
  ArrowLeft,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { BookingWithDetails, RentalMessage } from "@shared/schema";
import logoImage from "@assets/lendibl_logo1_1750383971030.png";

interface GroupedConversations {
  personId: number;
  personName: string;
  personAvatar: string | null;
  conversations: BookingWithDetails[];
}

export default function Messages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<BookingWithDetails | null>(null);
  const [messageText, setMessageText] = useState("");
  const [expandedPersons, setExpandedPersons] = useState<Set<number>>(new Set());

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['/api/bookings', 'conversations'],
    queryFn: async (): Promise<BookingWithDetails[]> => {
      const allBookings = await api.getBookings();
      return allBookings.filter(booking => 
        (booking.item.ownerId === user?.id || booking.renterId === user?.id) && 
        ['approved', 'in_progress', 'completed'].includes(booking.status)
      );
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Group conversations by person - memoized to prevent infinite re-renders
  const groupedConversations: GroupedConversations[] = useMemo(() => {
    return conversations.reduce((groups, conversation) => {
      const isOwner = conversation.item.ownerId === user?.id;
      const otherPerson = isOwner ? conversation.renter : conversation.item.owner;
      
      let group = groups.find(g => g.personId === otherPerson.id);
      if (!group) {
        group = {
          personId: otherPerson.id,
          personName: `${otherPerson.firstName} ${otherPerson.lastName}`,
          personAvatar: otherPerson.avatar,
          conversations: []
        };
        groups.push(group);
      }
      
      group.conversations.push(conversation);
      return groups;
    }, [] as GroupedConversations[]);
  }, [conversations, user?.id]);

  const togglePersonExpanded = (personId: number) => {
    setExpandedPersons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(personId)) {
        newSet.delete(personId);
      } else {
        newSet.add(personId);
      }
      return newSet;
    });
  };

  // Auto-expand single-conversation groups but preserve user choices
  useEffect(() => {
    setExpandedPersons(prev => {
      const newExpanded = new Set(prev);
      let hasChanges = false;
      
      groupedConversations.forEach(group => {
        if (group.conversations.length === 1 && !prev.has(group.personId)) {
          newExpanded.add(group.personId);
          hasChanges = true;
        }
      });
      
      // Only update state if there are actual changes
      return hasChanges ? newExpanded : prev;
    });
  }, [groupedConversations]);

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/rental-messages', selectedConversation?.id],
    queryFn: () => selectedConversation ? api.getRentalMessages(selectedConversation.id) : [],
    enabled: !!selectedConversation,
    refetchInterval: 5000,
  });

  const sendMessage = async () => {
    if (!selectedConversation || !messageText.trim()) return;
    
    try {
      await api.sendRentalMessage(selectedConversation.id, messageText.trim());
      setMessageText("");
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">Please sign in to access your messages.</p>
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <div className="bg-white border-b border-gray-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <img 
                src={logoImage} 
                alt="Lendibl" 
                className="h-12 cursor-pointer hover:scale-105 transition-transform duration-300"
              />
            </Link>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-gray-medium" />
              <span className="text-sm text-gray-medium">/</span>
              <span className="text-sm font-medium text-gray-dark">Messages</span>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-240px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse mb-2" />
                    ))}
                  </div>
                ) : groupedConversations.length > 0 ? (
                  <div className="space-y-0">
                    {groupedConversations.map((group) => (
                      <div key={group.personId}>
                        {/* Person Header */}
                        <div
                          onClick={() => togglePersonExpanded(group.personId)}
                          className="p-3 bg-gray-50 border-b cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-primary-blue to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-xs">
                                {group.personName.split(' ')[0][0]}{group.personName.split(' ')[1]?.[0] || ''}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{group.personName}</p>
                              <p className="text-xs text-gray-medium">
                                {group.conversations.length} conversation{group.conversations.length > 1 ? 's' : ''}
                              </p>
                            </div>
                            {expandedPersons.has(group.personId) ? (
                              <ChevronDown className="h-4 w-4 text-gray-medium" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-medium" />
                            )}
                          </div>
                        </div>

                        {/* Item Conversations */}
                        {expandedPersons.has(group.personId) && (
                          <div className="bg-white">
                            {group.conversations.map((conversation) => {
                              const isOwner = conversation.item.ownerId === user?.id;
                              
                              return (
                                <div
                                  key={conversation.id}
                                  onClick={() => setSelectedConversation(conversation)}
                                  className={`p-3 pl-8 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                                    selectedConversation?.id === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="w-2 h-2 bg-primary-blue rounded-full mt-2 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate text-gray-dark">
                                        {conversation.item.title}
                                      </p>
                                      <div className="flex items-center gap-4 mt-1">
                                        <span className="text-xs text-gray-medium">
                                          {isOwner ? 'You are owner' : 'You are renter'}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <Calendar className="h-3 w-3 text-gray-400" />
                                          <span className="text-xs text-gray-400">
                                            {new Date(conversation.startDate).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-medium">No conversations yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Message View */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedConversation(null)}
                        className="lg:hidden"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <CardTitle className="text-lg">{selectedConversation.item.title}</CardTitle>
                        <p className="text-sm text-gray-medium">
                          {selectedConversation.item.ownerId === user?.id 
                            ? `Chat with ${selectedConversation.renter.firstName} ${selectedConversation.renter.lastName}`
                            : `Chat with ${selectedConversation.item.owner.firstName} ${selectedConversation.item.owner.lastName}`
                          }
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {messages.length > 0 ? (
                        messages.map((message: any) => {
                          const isOwnMessage = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                  isOwnMessage
                                    ? 'bg-primary-blue text-white'
                                    : 'bg-gray-100 text-gray-dark'
                                }`}
                              >
                                <p className="text-sm">{message.message}</p>
                                <p className={`text-xs mt-1 ${
                                  isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                                }`}>
                                  {new Date(message.createdAt).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-medium text-center">Talk about stuff</p>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 min-h-[80px] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!messageText.trim()}
                        className="self-end"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-dark mb-2">Select a conversation</h3>
                    <p className="text-gray-medium">Choose a conversation from the left to start messaging</p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}