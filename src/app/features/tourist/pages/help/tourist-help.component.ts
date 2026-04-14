import { Component } from '@angular/core';

@Component({
  selector: 'app-tourist-help',
  templateUrl: './tourist-help.component.html',
  styleUrls: ['./tourist-help.component.css']
})
export class TouristHelpComponent {
  faqs = [
    {
      question: 'Comment réserver un hébergement?',
      answer: 'Pour réserver un hébergement, recherchez une destination, filtrez par type, dates et nombre de voyageurs. Cliquez sur l\'annonce de votre choix, puis sur "Réserver". Suivez les étapes de paiement pour confirmer.',
      open: false
    },
    {
      question: 'Puis-je annuler ma réservation?',
      answer: 'Oui, vous pouvez annuler votre réservation depuis la section "Mes Réservations". Les conditions d\'annulation varient selon l\'hébergement et le moment de l\'annulation. Les remboursements sont traités sous 5-10 jours ouvrés.',
      open: false
    },
    {
      question: 'Comment fonctionne le paiement?',
      answer: 'Nous acceptons les cartes de crédit, les virements bancaires et les porte-feuilles électroniques. Le paiement est sécurisé et traité via notre plateforme. Le montant est débité lors de la confirmation de la réservation.',
      open: false
    },
    {
      question: 'Comment contacter l\'hôte?',
      answer: 'Une fois votre réservation confirmée, vous pouvez envoyer des messages à l\'hôte depuis la section "Messages". Les hôtes répondent généralement dans les 24 heures.',
      open: false
    },
    {
      question: 'Que faire en cas de problème?',
      answer: 'En cas de problème, contactez immédiatement notre équipe d\'assistance via le chat ou par email à support@baladna.tn. Notre équipe est disponible 24/7 pour vous aider.',
      open: false
    }
  ];

  contactMethods = [
    { icon: 'bi-chat-dots-fill', title: 'Chat en direct', subtitle: 'Disponible 24/7', available: true },
    { icon: 'bi-envelope-fill', title: 'Email', subtitle: 'support@baladna.tn', available: true },
    { icon: 'bi-telephone-fill', title: 'Téléphone', subtitle: '+216 70 000 000', available: false },
  ];
}
