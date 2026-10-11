import os
import json
from datetime import datetime
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
    FilterExpression,
    Filter,
)

def get_page_views():
    # Load credentials from GitHub Secret
    credentials_info = json.loads(os.environ["GA_CREDENTIALS"])
    property_id = os.environ["GA_PROPERTY_ID"]
    
    # Authenticate and initialize client
    client = BetaAnalyticsDataClient.from_service_account_info(credentials_info)
    
    # Build report request
    request = RunReportRequest(
        property=f"properties/{property_id}",
        dimensions=[Dimension(name="pagePath")],
        metrics=[Metric(name="screenPageViews")],
        date_ranges=[DateRange(start_date="2020-01-01", end_date="today")],
        # FIXED: Replacing string_filter with the proper dedicated in_list_filter object
        dimension_filter=FilterExpression(
            filter=Filter(
                field_name="pagePath",
                in_list_filter=Filter.InListFilter(
                    values=["/", "/index.html"], 
                ),
            )
        ),
    )
    
    response = client.run_report(request)
    
    # Extract total views by accumulating matching rows
    total_views = 0
    if response.rows:
        for row in response.rows:
            # FIXED: Explicitly casting row.metric_values element directly
            total_views += int(row.metric_values[0].value)
        
    return total_views

def write_html(views):
    # Capture current date and time in UTC
    current_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Analytics Dashboard</title>
    <style>
        body {{ font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f4f9; }}
        .card {{ background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }}
        .count {{ font-size: 3rem; font-weight: bold; color: #2563eb; margin: 0.5rem 0; }}
        .timestamp {{ font-size: 0.85rem; color: #6b7280; margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 0.5rem; }}
    </style>
</head>
<body>
    <div class="card">
        <h2>Index Page Views</h2>
        <div class="count">{views:,}</div>
        <p>Accumulated since beginning of time</p>
        <div class="timestamp">Last updated: {current_time}</div>
    </div>
</body>
</html>"""

    with open("stats.html", "w") as f:
        f.write(html_content)

if __name__ == "__main__":
    views_count = get_page_views()
    write_html(views_count)