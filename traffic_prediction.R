# Module 6: Predictive Traffic Analytics using Multiple Linear Regression

print("[*] Initializing R Analytics Engine...")

# 1. Generate Synthetic Historical Traffic Data
set.seed(42)
hours <- 1:100
time_of_day <- hours %% 24
active_ips <- sample(50:500, 100, replace = TRUE)
traffic_volume_mb <- (time_of_day * 15) + (active_ips * 2.5) + rnorm(100, mean=0, sd=50)

network_data <- data.frame(Hour = hours, TimeOfDay = time_of_day, ActiveIPs = active_ips, VolumeMB = traffic_volume_mb)

# 2. Build the Multiple Linear Regression Model
print("\n[*] Training Multiple Linear Regression Model...")
model <- lm(VolumeMB ~ TimeOfDay + ActiveIPs, data = network_data)
print(summary(model))

# 3. Generate GUI-Ready Dark Theme Visualization
print("[*] Exporting Predictive Forecast Plot...")

# Outputting with a transparent/dark background to match the React dashboard
png("traffic_forecast.png", width = 800, height = 400, res=100, bg="#16181d")

# Set plot parameters for dark mode (white text, blue data points)
par(col.axis="#9ca3af", col.lab="#9ca3af", col.main="#f3f4f6", fg="#2a2b30", mar=c(5, 5, 4, 2))

plot(network_data$Hour, network_data$VolumeMB, type="p", pch=16, col="#3b82f6",
     xlab="Timeline (Hours)", ylab="Traffic Volume (MB)", 
     main="Multiple Linear Regression: Network Traffic Forecast")

# Add the regression trend line in bright red
abline(lm(VolumeMB ~ Hour, data=network_data), col="#ef4444", lwd=3)

dev.off()
print("[+] Plot saved as 'traffic_forecast.png'.")