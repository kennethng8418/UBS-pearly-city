# Pearly City Card Fare Calculator

## 📌 Problem Summary
The **Pearly City Metro** system is divided into zones (Zone 1, Zone 2, Zone 3, etc.).  
Passengers should be able to enter their journeys (from-zone → to-zone) and get the fare calculated automatically.  

**Fare Rules:**

| From – To       | Fare |
|-----------------|------|
| 1 – 1           | 40   |
| 1 – 2 / 2 – 1   | 55   |
| 1 – 3 / 3 – 1   | 65   |
| 2 – 2           | 35   |
| 2 – 3 / 3 – 2   | 45   |
| 3 – 3           | 30   |

The system must be **extensible** to support new zones in the future.

---

## 🎯 Objective
Build a **modular web application** with:
- **Backend (Django + DRF)**: API to calculate fares per journey and daily totals.  
- **Frontend (React)**: User form (up to 20 journeys), results table with sorting and filtering.  
- **Extensible fare engine** that follows OOP and SOLID principles.  
- **Unit tests** for both API and UI.  

---

## 🏗️ System Architecture
**High-level design:**

![Alt text](https://i.imgur.com/ufBbTuU.png)

- **Journey Input Form**
  - Users can enter up to **20 journeys per day**.
  - Each journey requires a `from_zone` and `to_zone`.

- **Fare Calculation**
  - Backend calculates fare per journey based on fare rules.
  - Returns both **journey-level fares** and **total daily fare**.

- **Results Table**
  - Displays journey details (`from_zone`, `to_zone`, `fare`).
  - Shows **total fare** at the bottom.
  - Supports **sorting** by columns (e.g., fare, from_zone, to_zone).
  - Supports **filtering** by fare (e.g., `>30`, `<60`, `=50`).

- **API Integration**
  - React frontend communicates with Django REST API.
  - Request/response in **JSON format**.
