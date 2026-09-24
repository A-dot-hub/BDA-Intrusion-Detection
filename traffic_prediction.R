# Module 6: Predictive Traffic Analytics using Multiple Linear Regression

print("[*] Initializing R Analytics Engine...")

# 1. Generate Synthetic Historical Traffic Data
# Simulating 100 hours of network metrics
set.seed(42)
hours <- 1:100
time_of_day <- hours %% 24
active_ips <- sample(50:500, 100, replace = TRUE)

# Traffic volume is influenced by time of day, number of IPs, plus some random noise
traffic_volume_mb <- (time_of_day * 15) + (active_ips * 2.5) + rnorm(100, mean=0, sd=50)

# Create a DataFrame
network_data <- data.frame(Hour = hours, TimeOfDay = time_of_day, ActiveIPs = active_ips, VolumeMB = traffic_volume_mb)

print("[+] Historical Data Loaded. Sample:")
print(head(network_data))

# 2. Build the Multiple Linear Regression Model
# Predicting VolumeMB based on TimeOfDay and ActiveIPs
print("\n[*] Training Multiple Linear Regression Model...")
model <- lm(VolumeMB ~ TimeOfDay + ActiveIPs, data = network_data)

# Output the statistical summary of the model
print(summary(model))

# 3. Predict Future Traffic (Automated Alert Thresholds)
# Simulating a future scenario: 2 PM (14:00) with a sudden spike to 800 active IPs
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