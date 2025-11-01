import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

// Import routes
import cognitoAuthRoutes from "./routes/cognito-auth.routes";
import testAuthRoutes from "./routes/test-auth.routes";
import userRoutes from "./routes/user.routes";
import practiceRoutes from "./routes/practice.routes";
import patientRoutes from "./routes/patient.routes";
import consentRoutes from "./routes/consent.routes"; // Assuming this exists
import contentRoutes from "./routes/content.routes"; // Assuming this exists
import photoSessionRoutes from "./routes/photo-session.routes"; // Assuming this exists
import workflowRoutes from "./routes/workflow.routes"; // Assuming this exists
import uploadRoutes from "./routes/upload.routes"; // Assuming this exists
import mediaRoutes from "./routes/media"; // Assuming this exists
import mediaPosts from "./routes/media-posts.routes"; // Assuming this exists
import reportsRoutes from "./routes/reports"; // Assuming this exists
import completedSessionsRoutes from "./routes/completed-sessions.routes"; // Assuming this exists
import testSessionsRoutes from "./routes/test-sessions.routes"; // Assuming this exists
import dashboardRoutes from "./routes/dashboard.routes"; // Assuming this exists
import sessionRoutes from "./routes/session.routes"; // Assuming this exists
import settingsRoutes from "./routes/settings.routes"; // Assuming this exists
import downloadRoutes from "./routes/download.routes";
import comparisonRoutes from "./routes/comparison.routes";
import mediaUpdateRoutes from "./routes/media-update.routes";

// Load environment variables
dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  "http://192.168.50.25:3000", // For mobile device testing nabz machine
  "capacitor://localhost", // For Capacitor apps
  "https://image-engage.vercel.app", // Production URL
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Logging middleware
app.use(morgan("combined"));

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "EmageSmileAI Backend API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// API routes
app.use("/api/cognito-auth", cognitoAuthRoutes); // Using Cognito for all auth operations
app.use("/api/test-auth", testAuthRoutes);
app.use("/api/user", userRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/consents", consentRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/photo-session", photoSessionRoutes);
app.use("/api/workflow", workflowRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/media-posts", mediaPosts);
app.use("/api/reports", reportsRoutes);
app.use("/api/completed-sessions", testSessionsRoutes);
app.use("/api/completed-sessions-old", completedSessionsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/comparison", comparisonRoutes);
app.use("/api/media", mediaUpdateRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", error);

    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    });
  }
);

export default app;
