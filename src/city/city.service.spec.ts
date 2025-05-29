// src\users\city\city.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { CitiesService } from './city.service';

describe('CityService', () => {
  let service: CitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CitiesService],
    }).compile();

    service = module.get<CitiesService>(CitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
