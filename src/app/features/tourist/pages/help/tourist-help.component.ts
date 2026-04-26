import { Component } from '@angular/core';

@Component({
  selector: 'app-tourist-help',
  templateUrl: './tourist-help.component.html',
  styleUrls: ['./tourist-help.component.css']
})
export class TouristHelpComponent {
  faqs = [
    {
      question: 'How do I book an accommodation?',
      answer: 'Search for a destination, filter by property type, travel dates, and number of guests, then open the listing you prefer and complete the booking steps to confirm.',
      open: false
    },
    {
      question: 'Can I cancel my booking?',
      answer: 'Yes. You can cancel from the "My Bookings" section. Cancellation terms depend on the property and how close you are to the check-in date. Refunds are usually processed within 5 to 10 business days.',
      open: false
    },
    {
      question: 'How does payment work?',
      answer: 'We accept credit cards, bank transfers, and e-wallet payments. Transactions are secured and processed through our platform, and the amount is charged when the booking is confirmed.',
      open: false
    },
    {
      question: 'How can I contact the host?',
      answer: 'Once your booking is confirmed, you can message the host from the "Messages" section. Most hosts reply within 24 hours.',
      open: false
    },
    {
      question: 'What should I do if I have an issue?',
      answer: 'If something goes wrong, contact our support team right away through live chat or by email at support@baladna.tn. The team is available 24/7 to help.',
      open: false
    }
  ];

  contactMethods = [
    { icon: 'bi-chat-dots-fill', title: 'Live chat', subtitle: 'Available 24/7', available: true },
    { icon: 'bi-envelope-fill', title: 'Email', subtitle: 'support@baladna.tn', available: true },
    { icon: 'bi-telephone-fill', title: 'Phone', subtitle: '+216 70 000 000', available: false }
  ];
}
