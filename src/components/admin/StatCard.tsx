import { Card, CardContent } from "@/components/ui/card";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@/components/FaIcon";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  iconBgColor = "bg-blue-100",
  iconColor = "text-blue-600"
}: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className={`flex items-center gap-1 text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <span>{trend.isPositive ? '↑' : '↓'}</span>
                <span>{Math.abs(trend.value)}%</span>
                <span className="text-gray-400 text-xs">vs 지난주</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-xl ${iconBgColor}`}>
            <FontAwesomeIcon icon={Icon} className={`w-6 h-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
