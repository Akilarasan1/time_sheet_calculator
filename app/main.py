from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from datetime import datetime, timedelta
import logging

app = FastAPI()

templates = Jinja2Templates(directory="app/templates")

# Function to calculate spent time
def spent_hours(in_times, out_times):
    total_spent = [
        datetime.strptime(out, "%I:%M:%S %p") - datetime.strptime(inn, "%I:%M:%S %p")
        for inn, out in zip(in_times, out_times)
    ]
    return sum(total_spent, timedelta())

# Route to render the input form
@app.get("/", methods=["GET", "HEAD"], response_class=HTMLResponse)
async def read_form(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

# Route to handle form submission and calculations
@app.post("/calculate/", response_class=HTMLResponse)
async def calculate_time(request: Request, raw_time: str = Form(...)):
    try:
        time_entries = raw_time.split()
        batch_size = 3
        time_blocks, in_times, out_times = [], [], []
        total_hours_td = timedelta(hours=8, minutes=30)

        # Group time entries into blocks of 3
        if len(time_entries) % 3 == 0:
            time_blocks = [time_entries[i:i + batch_size] for i in range(0, len(time_entries), batch_size)]
        else:
            return templates.TemplateResponse("index.html", {
                "request": request,
                "error": "Invalid input format. Ensure entries are in 'hh:mm:ss AM/PM In/Out' format."
            })

        # Separate "In" and "Out" times
        for block in time_blocks:
            if "In" in block:
                in_times.append(" ".join(block[:-1]))
            elif "Out" in block:
                out_times.append(" ".join(block[:-1]))

        if len(in_times) > len(out_times):
            total_spent = spent_hours(in_times, out_times)
            remaining_time = total_hours_td - total_spent
            last_in = datetime.strptime(in_times[-1], "%I:%M:%S %p")
            expected_logout = last_in + remaining_time
            return templates.TemplateResponse("index.html", {
                "request": request,
                "result": f"You can leave at {expected_logout.strftime('%I:%M:%S %p')}."
            })

        # Calculate total time spent
        total_spent = spent_hours(in_times, out_times)
        if total_spent >= total_hours_td:
            return templates.TemplateResponse("index.html", {
                "request": request,
                "result": f"You have completed your required hours. Total time spent: {total_spent}."
            })
        else:
            remaining_time = total_hours_td - total_spent
            return templates.TemplateResponse("index.html", {
                "request": request,
                "result": f"You need to stay for {remaining_time}."
            })
    except Exception as e:
        logging.error(f"Error in calculate_time: {e}")
        return templates.TemplateResponse("index.html", {
            "request": request,
            "error": "An unexpected error occurred. Please check your input."
        })
