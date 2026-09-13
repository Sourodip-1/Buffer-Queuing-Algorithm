# Buffer Queue Scheduling Algorithm

## Technical Documentation

## RUN USING ```streamlit run app.py```
This document explains the Buffer queue scheduling algorithm, including:

- How users are divided into groups
- How fairness scores are calculated
- How appointment slots are generated
- How travel feasibility is checked
- How BUFFER and FCFS users are scheduled
- How conflicts and unscheduled users are handled

---

## 1. System Overview

Buffer is a queue management system that allows users to register remotely and receive an appointment slot.

The system tries to:

1. Reduce physical waiting in queues.
2. Give fair priority to users who register during the buffer period.
3. Preserve first-come, first-served ordering after the buffer period.
4. Avoid assigning appointments that are impossible or impractical because of travel time.
5. Respect operating hours and breaks.

### 1.1 User Groups

Users are divided into two groups.

#### BUFFER Group

Users who register during the configured buffer period.

These users are ordered using a fairness score.

#### FCFS Group

Users who register after the buffer period ends.

These users are ordered by registration time:

> Earlier registration means earlier appointment.

### 1.2 Registration Cutoff

The queue has a final registration cutoff.

The cutoff is exactly two hours before the queue closing time.

**Example**

- Queue closing time: `17:00`
- Registration cutoff: `15:00`

Any user registering after the cutoff is marked as:

`UNSCHEDULED`

A user is eligible only when:

```text
registered_at <= registration_cutoff
```

The exact boundary must be defined by the implementation. The current rule treats registration exactly at the cutoff as valid.

---

## 2. Queue Configuration

The queue creator provides the following configuration.

| Setting | Description |
|---|---|
| Opening time | Time when the queue starts |
| Closing time | Time when the queue ends |
| Service duration | Time required to serve one user |
| Buffer period | Initial period during which users enter the BUFFER group |
| Break enabled | Whether a break is included |
| Break start | Start time of the break |
| Break end | End time of the break |
| Return-home check | Whether return-home feasibility is required |
| Return-home deadline | Latest acceptable return-home time |

### Example Configuration

```text
Opening time:        09:00
Closing time:        17:00
Service duration:    10 minutes
Buffer period:       60 minutes
Break enabled:       Yes
Break start:         13:00
Break end:           14:00
Return-home check:   Yes
Return-home deadline: 13:00
```

---

## 3. Registration Groups

The BUFFER period begins when the queue opens.

For example:

```text
Queue opens:       09:00
Buffer period:     60 minutes
Buffer ends:       10:00
```

Users are classified as follows:

| Registration time | Group |
|---|---|
| 09:00–10:00 | BUFFER |
| After 10:00 | FCFS |

The implementation must clearly define whether registration exactly at the buffer end belongs to BUFFER or FCFS.

Recommended rule:

```text
registered_at < buffer_end  -> BUFFER
registered_at >= buffer_end -> FCFS
```

---

## 4. Fairness Score

Only BUFFER users receive a fairness score.

The score is calculated using:

1. Age Factor
2. Convenience Factor

The general formula is:

```text
Fairness Score = (Age Weight × Age Factor)
               + (Convenience Weight × Convenience Factor)
```

Or mathematically:

```text
F_i = w_A × A_i + w_C × C_i
```

Where:

- `F_i` = fairness score of user `i`
- `A_i` = age factor
- `C_i` = convenience factor
- `w_A` = age weight
- `w_C` = convenience weight

The weights must satisfy:

```text
w_A + w_C = 1
```

### Initial Weights

```text
Age weight:          0.5
Convenience weight:  0.5
```

---

## 5. Age Factor

The current age factor is a policy-based piecewise formula.

### Case 1: Age 10 or below

```text
A = 1.0 - (age × 0.05)
```

Examples:

| Age | Age Factor |
|---:|---:|
| 0 | 1.00 |
| 5 | 0.75 |
| 10 | 0.50 |

### Case 2: Age greater than 10 and below 60

```text
A = 0.5
```

### Case 3: Age 60 or above

```text
A = min(1.0, 0.5 + ((age - 60) × 0.01))
```

Examples:

| Age | Age Factor |
|---:|---:|
| 60 | 0.50 |
| 70 | 0.60 |
| 80 | 0.70 |
| 110 | 1.00 |

### Important Note

This is a policy approximation. It is not a medically validated measure of vulnerability, disability, or ability to wait.

The age factor also creates a possible policy issue: age influences both the Age Factor and the Convenience Factor. This means age is counted twice.

---

## 6. Convenience Factor

The current convenience factor is also age-based.

| Age range | Convenience Factor |
|---|---:|
| Age 5 or below | 1.0 |
| Age 6–12 | 0.8 |
| Age 13–60 | 0.5 |
| Age 61–75 | 0.7 |
| Above 75 | 0.9 |

The current formula can be represented as:

```text
Age <= 5       -> C = 1.0
Age <= 12      -> C = 0.8
Age <= 60      -> C = 0.5
Age <= 75      -> C = 0.7
Age > 75       -> C = 0.9
```

In a future version, the Convenience Factor may use:

- Accessibility requirements
- User-provided time constraints
- Child-care responsibilities
- Work or school schedules
- Medical appointments
- Other explicitly defined needs

---

## 7. Travel Feasibility

Travel time does not increase a user's fairness score.

Travel time is used only to determine whether an appointment is feasible.

For each user, the system may receive:

- Travel time from home to the service location
- Travel time from the service location back home
- A return-home deadline

### 7.1 Appointment End Time

```text
appointment_end = appointment_start + service_duration
```

### 7.2 Latest Departure Time

```text
latest_departure = appointment_start - travel_time_out
```

### 7.3 Return-home Time

```text
return_home_time = appointment_end + travel_time_back
```

### 7.4 Return-home Rule

If the return-home check is enabled:

```text
return_home_time <= return_home_deadline
```

If this condition is false, the slot is not feasible for that user.

### Example

```text
Appointment start:  11:00
Service duration:   10 minutes
Travel back home:   40 minutes

Appointment end:    11:10
Return-home time:   11:50
```

If the return-home deadline is `13:00`, the appointment is feasible.

---

## 8. Slot Generation

The system generates appointment slots between opening and closing time.

For a service duration of 10 minutes:

```text
09:00
09:10
09:20
09:30
09:40
...
```

A slot is valid only if:

1. It starts after opening time.
2. The service finishes before closing time.
3. It does not overlap a break.
4. It is not already assigned to another user.

### Break Handling

If the queue has a break from `13:00` to `14:00`, no appointment may overlap that period.

For example:

```text
12:50–13:00  -> Valid
13:00–13:10  -> Invalid
13:50–14:00  -> Invalid
14:00–14:10  -> Valid
```

---

## 9. Scheduling Process

The scheduler follows this sequence.

### Step 1: Validate Registration

Check:

- Registration time
- Registration cutoff
- Required user data
- Queue configuration

Users registering after the cutoff become `UNSCHEDULED`.

### Step 2: Generate Slots

Generate all valid appointment slots while respecting:

- Opening time
- Closing time
- Service duration
- Breaks

### Step 3: Classify Users

Assign each valid user to:

- BUFFER
- FCFS

### Step 4: Calculate Fairness Scores

Calculate fairness scores for BUFFER users.

### Step 5: Sort BUFFER Users

Sort BUFFER users by:

1. Fairness score, highest first
2. Registration time, earliest first
3. User ID, ascending

### Step 6: Assign BUFFER Users

Assign each BUFFER user the earliest feasible available slot.

Feasibility may include:

- Slot availability
- Service completion before closing
- Break restrictions
- Return-home deadline, if enabled

### Step 7: Assign FCFS Users

Sort FCFS users by:

1. Registration time, earliest first
2. User ID, ascending

Assign each FCFS user the earliest available slot.

The current FCFS policy checks that the appointment finishes before closing. It does not apply the return-home deadline.

This policy should be reviewed before production because it may create inconvenient appointments for users who live far away.

### Step 8: Record Results

For every user, record:

- Assigned slot
- Group
- Fairness score, if applicable
- Feasibility result
- Unscheduled reason, if applicable
- Any scheduling swap

---

## 10. Feasibility Swapping

A feasibility swap may be used when a user with a difficult travel constraint cannot receive a feasible slot.

### Basic Idea

Suppose:

- User A has a strict return-home deadline.
- User B has a more flexible schedule.
- User A is currently assigned too late.
- User B is assigned an earlier slot.

The system may attempt to:

1. Move User A to the earlier slot.
2. Move User B to the later slot.
3. Verify that both assignments remain feasible.
4. Keep the swap only if both users remain valid.

### Swap Conditions

A swap is allowed only if:

```text
new_slot_for_A is feasible
AND
new_slot_for_B is feasible
```

The system must log every swap.

Example log:

```text
SWAP PERFORMED
User A: 12:30 -> 10:30
User B: 10:30 -> 12:30
Reason: User A could not meet return-home deadline
```

---

## 11. Four-user Example

Assume the queue opens at `09:00`.

| User | Travel to queue | Travel back home |
|---|---:|---:|
| U1 | 58 minutes | 58 minutes |
| U2 | 5 minutes | 5 minutes |
| U3 | 20 minutes | 20 minutes |
| U4 | 30 minutes | 30 minutes |

The system should not automatically give U1 the highest fairness score just because U1 travels farther.

Instead:

- Fairness score determines BUFFER ordering.
- Travel time determines whether a slot is feasible.
- A feasibility swap may move U1 earlier if a later slot would violate U1's return-home deadline.
- U2, U3, and U4 should not be unfairly delayed without a valid reason.

This separates:

```text
Fairness priority
```

from:

```text
Travel feasibility
```

---

## 12. Unscheduled Reasons

Every unscheduled user should receive a clear reason.

Recommended reason codes:

```text
AFTER_REGISTRATION_CUTOFF
NO_AVAILABLE_SLOT
NO_FEASIBLE_SLOT
INVALID_USER_DATA
INVALID_QUEUE_CONFIGURATION
OUTSIDE_OPERATING_HOURS
```

Example:

```text
status: UNSCHEDULED
reason: NO_FEASIBLE_SLOT
message: No appointment slot satisfies the return-home deadline.
```

---

## 13. Required Test Cases

The algorithm should be tested with at least the following cases.

### Registration Tests

- Registration before opening
- Registration exactly at opening
- Registration during BUFFER
- Registration exactly at BUFFER end
- Registration after BUFFER
- Registration exactly at cutoff
- Registration after cutoff
- Registration after closing

### Slot Tests

- Normal slot generation
- Service duration handling
- Closing-time boundary
- Break handling
- Appointment overlapping a break
- No available slots

### Fairness Tests

- Age factor for children
- Age factor for adults
- Age factor for seniors
- Convenience factor boundaries
- Weight validation
- Fairness-score tie
- Registration-time tie
- User-ID tie

### Travel Tests

- Travel time shorter than available time
- Travel time equal to available time
- Travel time longer than available time
- Return-home deadline satisfied
- Return-home deadline violated
- Return-home check disabled

### Scheduling Tests

- BUFFER ordering
- FCFS ordering
- BUFFER and FCFS interaction
- Feasibility swapping
- No feasible slot
- Four-user example
- Correct unscheduled reasons
- Correct scheduling logs

---

## 14. Recommended Python Structure

A possible project structure is:

```text
buffer_algorithm/
├── main.py
├── models.py
├── config.py
├── age_factor.py
├── convenience_factor.py
├── fairness_score.py
├── slot_generator.py
├── travel_feasibility.py
├── scheduler.py
├── utils.py
└── tests/
    ├── test_age_factor.py
    ├── test_convenience_factor.py
    ├── test_slot_generator.py
    ├── test_feasibility.py
    └── test_scheduler.py
```

For the first prototype, a single Python file is acceptable. The code can be separated into modules after the logic is stable.

---

## 15. Policy and Design Considerations

Before using this algorithm in production, review the following points.

### 15.1 Age Is Used Twice

Age affects both:

- Age Factor
- Convenience Factor

This may unintentionally give age more influence than expected.

### 15.2 Piecewise Boundaries

Some age boundaries create sudden score changes.

For example, the formula should be checked carefully around:

- Age 5
- Age 10
- Age 12
- Age 60
- Age 75

### 15.3 Greedy Scheduling Limitations

Assigning the earliest feasible slot is simple, but it may fail to find a globally feasible schedule.

A future version may use:

- Bipartite matching
- Constraint programming
- Backtracking
- Integer programming
- Optimization-based scheduling

### 15.4 Explainability

The system should be able to explain:

- Why a user was scheduled before another user
- Why a user was moved
- Why a slot was rejected
- Why a user was unscheduled

---

## 16. Future Improvements

Possible future features include:

- User-specific return-home deadlines
- Accessibility-based priority
- More flexible fairness policies
- Historical data analysis
- Better travel-time estimates
- Google Maps or another map service
- Weather-aware feasibility checks
- Dynamic rescheduling
- Queue congestion prediction
- Admin dashboard
- Audit logs
- Explainable scheduling decisions

---


### 17. Explanation

1. The user registers for an appointment.
2. The system validates the registration time and user information.
3. Users registering after the cutoff are marked as unscheduled.
4. Valid users are classified into BUFFER or FCFS.
5. BUFFER users receive fairness scores and are sorted by priority.
6. FCFS users are sorted by registration time.
7. The scheduler assigns feasible appointment slots.
8. If necessary, the system attempts a feasibility swap.
9. Users without a valid slot receive an unscheduled reason.
10. The final schedule and audit logs are returned.

---

## 18. Summary

The Buffer scheduling algorithm uses two separate ideas:

### Fairness

Fairness determines the order of BUFFER users.

```text
Fairness Score = weighted age and convenience factors
```

### Feasibility

Feasibility determines whether a particular appointment slot is practical.

```text
Return-home time <= return-home deadline
```

Travel distance and travel time do not directly increase fairness priority.

The final scheduling process is:

```text
Validate registration
        ↓
Generate appointment slots
        ↓
Classify users into BUFFER and FCFS
        ↓
Calculate fairness scores
        ↓
Schedule BUFFER users
        ↓
Schedule FCFS users
        ↓
Attempt feasibility swaps
        ↓
Record assignments and unscheduled reasons
```

This design is suitable as a first prototype, but the policy rules should be reviewed and tested carefully before production use.
