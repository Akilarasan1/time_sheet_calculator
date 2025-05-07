// app2/script.js
document.addEventListener('DOMContentLoaded', function() {
    const timeForm = document.getElementById('time-form');
    const timeInput = document.getElementById('time-input');
    const resultDiv = document.getElementById('result');
    const errorDiv = document.getElementById('error');
    const clearBtn = document.getElementById('clear-btn');
    
    // Clear form function
    function clearForm() {
        timeInput.value = '';
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        timeInput.focus();
    }
    
    // Clear button handler
    clearBtn.addEventListener('click', clearForm);
    
    // Form submission handler
    timeForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const input = timeInput.value.trim();
        
        // Reset display
        resultDiv.classList.add('hidden');
        errorDiv.classList.add('hidden');
        
        try {
            if (!input) {
                throw new Error('Please enter time logs');
            }
            
            const timeEntries = input.split(/\s+/);
            const requiredHours = 8.5; // 8 hours 30 minutes
            const requiredMilliseconds = requiredHours * 60 * 60 * 1000;
            
            if (timeEntries.length % 3 !== 0) {
                throw new Error("Invalid format. Each entry should be: 'hh:mm:ss AM/PM In/Out'");
            }
            
            // Parse all time entries
            let sessions = [];
            for (let i = 0; i < timeEntries.length; i += 3) {
                const timeStr = `${timeEntries[i]} ${timeEntries[i+1]}`;
                const type = timeEntries[i+2];
                sessions.push({
                    time: parseTime(timeStr),
                    type: type
                });
            }
            
            // Calculate total time worked
            let totalWorked = 0;
            let lastInTime = null;
            
            for (let session of sessions) {
                if (session.type === 'In') {
                    lastInTime = session.time;
                } else if (session.type === 'Out' && lastInTime) {
                    totalWorked += (session.time - lastInTime);
                    lastInTime = null;
                }
            }
            
            // Handle the case where we're still "In"
            if (lastInTime) {
                const remainingMilliseconds = requiredMilliseconds - totalWorked;
                const leaveTime = new Date(lastInTime.getTime() + remainingMilliseconds);
                
                resultDiv.textContent = `You can leave at ${formatTime(leaveTime)}`;
                resultDiv.classList.remove('hidden');
            } 
            else if (totalWorked >= requiredMilliseconds) {
                resultDiv.textContent = `Completed required hours. Total: ${formatDuration(totalWorked)}`;
                resultDiv.classList.remove('hidden');
            } 
            else {
                const remainingMilliseconds = requiredMilliseconds - totalWorked;
                resultDiv.textContent = `Need to stay for ${formatDuration(remainingMilliseconds)}`;
                resultDiv.classList.remove('hidden');
            }
            
            // Clear input after successful calculation
            timeInput.value = '';
            
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
    });
    
    // Helper functions
    function parseTime(timeStr) {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        
        let hour24 = hours;
        if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
        } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
        }
        
        // Create date object at fixed date (to avoid timezone issues)
        const date = new Date(2000, 0, 1, hour24, minutes, seconds);
        return date;
    }
    
    function formatTime(date) {
        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        const period = hours >= 12 ? 'PM' : 'AM';
        
        hours = hours % 12;
        hours = hours || 12; // Convert 0 to 12
        
        return `${hours}:${minutes}:${seconds} ${period}`;
    }
    
    function formatDuration(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours}h ${minutes}m ${seconds}s`;
    }
});
