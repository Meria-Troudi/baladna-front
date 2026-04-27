import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { RecommendationSearchComponent } from './pages/recommendation-search/recommendation-search.component';
import { SimilarRecommendationsComponent } from './chat/components/similar-recommendations/similar-recommendations.component';
import { RecommendationService } from './services/recommendation.service';
import { ErrorHandlerInterceptor } from '../../core/interceptors/error-handler.interceptor';

@NgModule({
  declarations: [
    RecommendationSearchComponent,
    SimilarRecommendationsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [
    RecommendationService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorHandlerInterceptor,
      multi: true
    }
  ],
  exports: [
    RecommendationSearchComponent,
    SimilarRecommendationsComponent
  ]
})
export class RecommendationModule { }
