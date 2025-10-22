(function() {
  'use strict';

  // Configuration
  const config = window.EmageSmileChatbot || {
    apiUrl: '/api/chatbot/chat',
    position: 'bottom-right',
    primaryColor: '#3B82F6',
    title: 'Ask us anything!',
    placeholder: 'Type your question...',
    welcomeMessage: 'Hi! How can I help you today?'
  };

  // Widget HTML
  const widgetHTML = `
    <div id="EmageSmile-chatbot-container" style="
      position: fixed;
      ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <!-- Chat Button -->
      <div id="chatbot-button" style="
        width: 60px;
        height: 60px;
        background: ${config.primaryColor};
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
      ">
        <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>

      <!-- Chat Window -->
      <div id="chatbot-window" style="
        position: absolute;
        ${config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 80px;'}
        ${config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
        width: 350px;
        height: 500px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        display: none;
        flex-direction: column;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          background: ${config.primaryColor};
          color: white;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${config.title}</h3>
          <button id="close-chat" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 18px;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>

        <!-- Messages -->
        <div id="chat-messages" style="
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          background: #f8fafc;
        ">
          <div class="bot-message" style="
            background: white;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          ">
            ${config.welcomeMessage}
          </div>
        </div>

        <!-- Booking Interface -->
        <div id="booking-interface" style="display: none; padding: 16px; background: white; border-top: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600;">Book an Appointment</h4>
          <div id="booking-form">
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px;">Appointment Type</label>
              <select id="appointment-type" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                <option value="consultation">Consultation</option>
                <option value="cleaning">Cleaning</option>
                <option value="checkup">Checkup</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div style="margin-bottom: 12px;">
              <label style="display: block; font-size: 12px; font-weight: 500; margin-bottom: 4px;">Available Times</label>
              <div id="time-slots" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; max-height: 120px; overflow-y: auto;">
                <!-- Time slots will be populated here -->
              </div>
            </div>
            <div id="patient-form" style="display: none;">
              <div style="margin-bottom: 8px;">
                <input type="text" id="patient-name" placeholder="Your Name" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
              </div>
              <div style="margin-bottom: 8px;">
                <input type="email" id="patient-email" placeholder="Your Email" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
              </div>
              <div style="margin-bottom: 12px;">
                <input type="tel" id="patient-phone" placeholder="Your Phone" style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
              </div>
              <button id="confirm-booking" style="
                width: 100%;
                background: ${config.primaryColor};
                color: white;
                border: none;
                padding: 10px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
              ">Confirm Appointment</button>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div style="
          padding: 16px;
          border-top: 1px solid #e2e8f0;
          background: white;
        ">
          <div style="display: flex; gap: 8px;">
            <input type="text" id="chat-input" placeholder="${config.placeholder}" style="
              flex: 1;
              padding: 10px 12px;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
            ">
            <button id="send-message" style="
              background: ${config.primaryColor};
              color: white;
              border: none;
              padding: 10px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            ">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Initialize widget
  function initWidget() {
    // Add widget to page
    document.body.insertAdjacentHTML('beforeend', widgetHTML);

    const button = document.getElementById('chatbot-button');
    const window = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('close-chat');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-message');
    const messages = document.getElementById('chat-messages');
    const bookingInterface = document.getElementById('booking-interface');

    let selectedSlot = null;

    // Toggle chat window
    button.addEventListener('click', () => {
      window.style.display = window.style.display === 'none' ? 'flex' : 'none';
    });

    closeBtn.addEventListener('click', () => {
      window.style.display = 'none';
    });

    // Send message
    function sendMessage() {
      const message = input.value.trim();
      if (!message) return;

      addMessage(message, 'user');
      input.value = '';

      // Send to API
      fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          addMessage(data.data.response, 'bot');
          
          // Handle booking action
          if (data.data.actionType === 'show_booking') {
            showBookingInterface(data.data.actionData);
          }
        } else {
          addMessage('Sorry, I encountered an error. Please try again.', 'bot');
        }
      })
      .catch(error => {
        console.error('Chat error:', error);
        addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      });
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Add message to chat
    function addMessage(text, sender) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `${sender}-message`;
      messageDiv.style.cssText = `
        background: ${sender === 'user' ? config.primaryColor : 'white'};
        color: ${sender === 'user' ? 'white' : '#374151'};
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
        ${sender === 'user' ? 'margin-left: 20px;' : ''}
        ${sender === 'bot' ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : ''}
        font-size: 14px;
        line-height: 1.4;
      `;
      messageDiv.textContent = text;
      messages.appendChild(messageDiv);
      messages.scrollTop = messages.scrollHeight;
    }

    // Show booking interface
    function showBookingInterface(actionData) {
      bookingInterface.style.display = 'block';
      
      if (actionData && actionData.availableSlots) {
        populateTimeSlots(actionData.availableSlots);
      } else {
        // Generate demo slots for next 7 days
        generateDemoSlots();
      }
    }

    // Generate demo time slots
    function generateDemoSlots() {
      const timeSlotsContainer = document.getElementById('time-slots');
      timeSlotsContainer.innerHTML = '';

      const today = new Date();
      const slots = [];

      // Generate slots for next 7 days (weekdays only)
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        // Generate morning and afternoon slots
        const times = ['09:00:00', '10:00:00', '11:00:00', '14:00:00', '15:00:00', '16:00:00'];
        
        times.forEach(time => {
          slots.push({
            date: date.toISOString().split('T')[0],
            startTime: time,
            displayDate: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            displayTime: new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
          });
        });
      }

      // Display first 8 slots
      slots.slice(0, 8).forEach(slot => {
        const slotBtn = document.createElement('button');
        slotBtn.style.cssText = `
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 12px;
          text-align: center;
          transition: all 0.2s;
        `;
        slotBtn.innerHTML = `<div style="font-weight: 500;">${slot.displayDate}</div><div>${slot.displayTime}</div>`;
        
        slotBtn.addEventListener('click', () => {
          // Remove selection from other slots
          document.querySelectorAll('#time-slots button').forEach(btn => {
            btn.style.background = 'white';
            btn.style.borderColor = '#d1d5db';
          });
          
          // Select this slot
          slotBtn.style.background = config.primaryColor;
          slotBtn.style.borderColor = config.primaryColor;
          slotBtn.style.color = 'white';
          
          selectedSlot = slot;
          document.getElementById('patient-form').style.display = 'block';
        });
        
        timeSlotsContainer.appendChild(slotBtn);
      });
    }

    // Handle booking confirmation
    document.getElementById('confirm-booking').addEventListener('click', () => {
      const name = document.getElementById('patient-name').value.trim();
      const email = document.getElementById('patient-email').value.trim();
      const phone = document.getElementById('patient-phone').value.trim();
      const appointmentType = document.getElementById('appointment-type').value;

      if (!name || !email || !phone || !selectedSlot) {
        alert('Please fill in all fields and select a time slot.');
        return;
      }

      // Send booking request
      fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientName: name,
          patientEmail: email,
          patientPhone: phone,
          appointmentDate: selectedSlot.date,
          appointmentTime: selectedSlot.startTime,
          appointmentType: appointmentType,
          source: 'chatbot'
        }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          addMessage(`Great! Your ${appointmentType} appointment has been scheduled for ${selectedSlot.displayDate} at ${selectedSlot.displayTime}. You'll receive a confirmation email shortly.`, 'bot');
          bookingInterface.style.display = 'none';
          
          // Reset form
          document.getElementById('patient-name').value = '';
          document.getElementById('patient-email').value = '';
          document.getElementById('patient-phone').value = '';
          document.getElementById('patient-form').style.display = 'none';
          selectedSlot = null;
        } else {
          addMessage('Sorry, there was an issue booking your appointment. Please call us at (555) 123-4567.', 'bot');
        }
      })
      .catch(error => {
        console.error('Booking error:', error);
        addMessage('Sorry, there was an issue booking your appointment. Please call us at (555) 123-4567.', 'bot');
      });
    });

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();