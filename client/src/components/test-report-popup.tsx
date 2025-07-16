import { useState, useEffect } from "react";
import ReportMisbehaviorModal from "./report-misbehavior-modal";
import type { BookingWithDetails } from "@shared/schema";

// Test rental data for the popup
const testRental: BookingWithDetails = {
  id: 1,
  userId: 2,
  itemId: 1,
  startDate: "2025-01-15",
  endDate: "2025-01-17",
  totalPrice: "25.00",
  status: "completed",
  message: "Test rental for misbehavior reporting",
  createdAt: new Date().toISOString(),
  paymentIntentId: "test_payment",
  item: {
    id: 1,
    title: "Professional DSLR Camera Kit",
    description: "Complete camera setup with lenses",
    category: "Electronics",
    pricePerDay: "25.00",
    location: "123 Main St, San Francisco, CA 94102",
    images: [],
    ownerId: 3,
    createdAt: new Date().toISOString(),
    currentPrice: "1200.00",
    condition: "Excellent",
    availability: ["2025-01-15", "2025-01-16", "2025-01-17"],
    categoryId: 1,
    owner: {
      id: 3,
      username: "cameraguy",
      email: "camera@example.com",
      firstName: "Camera",
      lastName: "Owner",
      hashedPassword: "test",
      createdAt: new Date().toISOString(),
      rating: 4.8,
      responseRate: 95,
      averageResponseTime: 2.5,
      stripeAccountId: null,
      paypalEmail: null
    }
  },
  user: {
    id: 2,
    username: "testrenter",
    email: "renter@example.com",
    firstName: "Test",
    lastName: "Renter",
    hashedPassword: "test",
    createdAt: new Date().toISOString(),
    rating: 4.5,
    responseRate: 90,
    averageResponseTime: 3.0,
    stripeAccountId: null,
    paypalEmail: null
  },
  renter: {
    id: 2,
    username: "testrenter",
    email: "renter@example.com",
    firstName: "Test",
    lastName: "Renter",
    hashedPassword: "test",
    createdAt: new Date().toISOString(),
    rating: 4.5,
    responseRate: 90,
    averageResponseTime: 3.0,
    stripeAccountId: null,
    paypalEmail: null
  }
};

export default function TestReportPopup() {
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    // Show the report popup immediately when component mounts
    const timer = setTimeout(() => {
      setShowReport(true);
    }, 500); // Small delay for better UX

    return () => clearTimeout(timer);
  }, []);

  return (
    <ReportMisbehaviorModal
      isOpen={showReport}
      onClose={() => setShowReport(false)}
      rental={testRental}
      userRole="renter"
    />
  );
}