import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Users, Calendar, Mail, User } from "lucide-react";

interface First100User {
  registrationOrder: number;
  username: string;
  email: string;
  registeredAt: string;
}

interface First100Response {
  count: number;
  users: First100User[];
}

export default function AdminFirst100() {
  const { data, isLoading, error } = useQuery<First100Response>({
    queryKey: ['/api/admin/first-100-users'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-600">Access denied or failed to load data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-gray-900">First 100 Users</h1>
          </div>
          <p className="text-gray-600">Tracking lendibl's first 100 community members</p>
        </div>

        {/* Stats Card */}
        <Card className="bg-white/70 backdrop-blur-sm border border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Registration Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="text-3xl font-bold text-blue-600">
                {data?.count || 0}
              </div>
              <div className="text-gray-600">/ 100 users registered</div>
              <Badge variant={data?.count === 100 ? "default" : "secondary"}>
                {data?.count === 100 ? "Complete!" : "In Progress"}
              </Badge>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(((data?.count || 0) / 100) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Grid */}
        {data?.users && data.users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.users.map((user) => (
              <Card 
                key={user.registrationOrder}
                className="bg-white/70 backdrop-blur-sm border border-blue-200 hover:shadow-lg transition-all duration-200"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      #{user.registrationOrder}
                    </Badge>
                    {user.registrationOrder <= 10 && (
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {new Date(user.registeredAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white/70 backdrop-blur-sm border border-blue-200">
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users registered yet</p>
              <p className="text-sm text-gray-500 mt-2">
                New registrations will appear here automatically
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}