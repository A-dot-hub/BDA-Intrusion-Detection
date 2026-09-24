# Module 6: Predictive Traffic Analytics using Multiple Linear Regression

print("[*] Initializing R Analytics Engine...")

set.seed(42)
hours <- 1:100
time_of_day <- hours %% 24
active_ips <- sample(50:500, 100, replace = TRUE)

traffic_volume_mb <- (time_of_day * 15) + (active_ips * 2.5) + rnorm(100, mean=0, sd=50)
network_data <- data.frame(Hour = hours, TimeOfDay = time_of_day, ActiveIPs = active_ips, VolumeMB = traffic_volume_mb)

print("\n[*] Training Multiple Linear Regression Model...")
model <- lm(VolumeMB ~ TimeOfDay + ActiveIPs, data = network_data)
print(summary(model))

future_scenario <- data.frame(TimeOfDay = c(14), ActiveIPs = c(800))
predicted_volume <- predict(model, future_scenario)

cat("\n======================================================\n")
cat("[ALERT SCENARIO] Predicting traffic for 14:00 with 800 Active IPs...\n")
cat(sprintf("-> Expected Baseline Volume: %.2f MB\n", predict(model, data.frame(TimeOfDay=14, ActiveIPs=200))))
cat(sprintf("-> Predicted Spike Volume: %.2f MB\n", predicted_volume))

if (predicted_volume > 1500) {
  cat("[CRITICAL] Predicted volume exceeds infrastructure capacity! Triggering auto-scaling.\n")
}
cat("======================================================\n")

# Generate GUI-Ready Visualization
print("[*] Exporting Predictive Forecast Plot...")
png("traffic_forecast.png", width = 800, height = 400, res=100)

plot(network_data$Hour, network_data$VolumeMB, type="p", pch=16, col="darkgray",
     xlab="Timeline (Hours)", ylab="Traffic Volume (MB)", 
     main="Multiple Linear Regression: Network Traffic Forecast")

# Add the regression trend line
abline(lm(VolumeMB ~ Hour, data=network_data), col="red", lwd=3)

dev.off()
print("[+] Plot saved as 'traffic_forecast.png'.")