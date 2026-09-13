import csv
import random

def generate_sample_data(num_users=70, output_file="sample_data.csv"):
    first_names = ["Arjun", "Priya", "Rahul", "Neha", "Vikram", "Sneha", "Karan", "Pooja", "Rohan", "Anjali", "Aditya", "Riya", "Amit", "Kriti", "Suresh"]
    last_names = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Das", "Reddy", "Rao", "Nair"]
    
    with open(output_file, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(["id", "name", "age", "registered_at", "outbound_travel_minutes", "return_travel_minutes"])
        
        for i in range(1, num_users + 1):
            user_id = f"U{i}"
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            age = random.randint(10, 75)
            
            # Generate registration times between 08:30 and 11:30
            # Buffer period will be up to 10:00 (assuming queue opens at 09:00 with 60 min buffer)
            reg_hour = random.choice([8, 9, 10, 11])
            reg_minute = random.randint(0, 59)
            if reg_hour == 8 and reg_minute < 30:
                reg_minute = random.randint(30, 59)
                
            registered_at = f"{reg_hour:02d}:{reg_minute:02d}"
            
            # Distance / travel time (5 to 120 minutes)
            outbound_travel_minutes = random.randint(5, 120)
            return_travel_minutes = outbound_travel_minutes + random.randint(-10, 10)
            if return_travel_minutes < 5:
                return_travel_minutes = 5
                
            writer.writerow([user_id, name, age, registered_at, outbound_travel_minutes, return_travel_minutes])
            
    print(f"Successfully generated {num_users} users in {output_file}")

if __name__ == "__main__":
    generate_sample_data()
