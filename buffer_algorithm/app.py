import sys
import os

# Ensure the parent directory is in the Python path so 'buffer_algorithm' module can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime

from buffer_algorithm.models import QueueSettings, User
from buffer_algorithm.scheduler import schedule_users
from buffer_algorithm.config import INITIAL_WEIGHTS

st.set_page_config(layout="wide", page_title="Buffer Frontend")

st.title("Buffer - Fairness Queue Simulator")

# --- 1. Load Data ---
data_file = "sample_data.csv"
if not os.path.exists(data_file):
    st.warning(f"{data_file} not found. Please run generate_data.py first.")
    st.stop()

df = pd.read_csv(data_file)

# --- 2. Sidebar Settings ---
st.sidebar.header("Queue Settings")
opening_time = st.sidebar.text_input("Opening Time", "09:00")
closing_time = st.sidebar.text_input("Closing Time", "17:00")
service_duration = st.sidebar.number_input("Service Duration (mins)", 5, 60, 10)
buffer_duration = st.sidebar.number_input("Buffer Duration (mins)", 0, 240, 60)

break_enabled = st.sidebar.checkbox("Enable Lunch Break", True)
break_start = st.sidebar.text_input("Break Start", "13:00")
break_end = st.sidebar.text_input("Break End", "14:00")

feasibility_enabled = st.sidebar.checkbox("Return-Home Feasibility", True)
deadline = st.sidebar.text_input("Return-Home Deadline (Default: End of Day)", "17:00")

st.sidebar.header("Weights")
INITIAL_WEIGHTS["age_weight"] = st.sidebar.slider("Age Weight", 0.0, 1.0, 0.5, 0.1)
INITIAL_WEIGHTS["convenience_weight"] = 1.0 - INITIAL_WEIGHTS["age_weight"]
st.sidebar.text(f"Convenience Weight: {INITIAL_WEIGHTS['convenience_weight']:.1f}")

settings = QueueSettings(
    opening_time=opening_time,
    closing_time=closing_time,
    service_duration_minutes=service_duration,
    buffer_duration_minutes=buffer_duration,
    break_enabled=break_enabled,
    break_start=break_start,
    break_end=break_end,
    return_home_feasibility_enabled=feasibility_enabled,
    return_home_deadline=deadline,
)

# Calculate Capacity
from buffer_algorithm.utils import parse_time
try:
    total_mins = (parse_time(closing_time) - parse_time(opening_time)).total_seconds() / 60
    if break_enabled:
        total_mins -= (parse_time(break_end) - parse_time(break_start)).total_seconds() / 60
    max_capacity = int(total_mins // service_duration)
    
    st.info(f"**Queue Capacity:** We can accommodate **{max_capacity}** people today across both halves (Average time: {service_duration} mins).")
except Exception as e:
    st.error(f"Could not calculate capacity: {e}")

# --- 3. Editable Table ---
st.subheader("Edit Sample Users")
st.markdown("Modify any cell below. The algorithm will dynamically recompute when you run it.")
edited_df = st.data_editor(df, num_rows="dynamic", use_container_width=True)

# --- 4. Run Algorithm ---
users = []
for idx, row in edited_df.iterrows():
    try:
        users.append(User(
            id=str(row["id"]),
            name=str(row["name"]),
            age=int(row["age"]),
            registered_at=str(row["registered_at"]),
            outbound_travel_minutes=int(row["outbound_travel_minutes"]),
            return_travel_minutes=int(row["return_travel_minutes"])
        ))
    except Exception as e:
        st.error(f"Error parsing row {idx}: {e}")

if st.button("Run Scheduler", type="primary"):
    result = schedule_users(users, settings)
    scheduled = result["schedule"]
    unscheduled = result["unscheduled_users"]
    
    st.success(f"Scheduled {len(scheduled)} users. Unscheduled: {len(unscheduled)} users.")
    
    out_df = pd.DataFrame(scheduled)
    
    st.subheader("Detailed Schedule")
    if not out_df.empty:
        st.dataframe(out_df, use_container_width=True)
    
    # --- 5. Visual Queue (Gantt Chart) ---
    st.subheader("Visual Queue Timeline")
    if not out_df.empty:
        today = datetime.now().strftime("%Y-%m-%d ")
        out_df['start_dt'] = pd.to_datetime(today + out_df['appointment_start'])
        out_df['end_dt'] = pd.to_datetime(today + out_df['appointment_end'])
        
        fig = px.timeline(out_df, x_start="start_dt", x_end="end_dt", y="user_id", color="group", 
                          title="Appointment Timeline", hover_data=["appointment_start", "appointment_end", "fairness_score"])
        fig.update_yaxes(autorange="reversed")
        st.plotly_chart(fig, use_container_width=True)
        
    # --- 6. Graphs & Analytics ---
    st.subheader("Analytics")
    col1, col2 = st.columns(2)
    
    with col1:
        if not out_df.empty:
            fig_hist = px.histogram(out_df, x="fairness_score", nbins=15, title="Fairness Score Distribution")
            st.plotly_chart(fig_hist, use_container_width=True)
            
    with col2:
        if unscheduled:
            unsched_df = pd.DataFrame(unscheduled)
            st.write("Unscheduled Users")
            st.dataframe(unsched_df, use_container_width=True)
        else:
            st.info("All users successfully scheduled within their constraints!")
            
    # --- 7. Show calculations ---
    st.subheader("Calculations Details")
    st.markdown("""
    The fairness score $F_i$ is calculated using the weighted sum of Age Factor $A_i$ and Convenience Factor $C_i$:
    """)
    st.latex(r"F_i = w_A A_i + w_C C_i")
    st.markdown("""
    Travel feasibility checks if $E_i + T_{back}(i) \leq \text{Deadline}$. If not, the slot is skipped for that user.
    """)
