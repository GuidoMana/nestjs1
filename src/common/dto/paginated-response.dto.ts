// src/common/dto/paginated-response.dto.ts
import { Expose } from 'class-transformer';

export class PaginatedResponseDto<T> {
  @Expose()
  data: T[];

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
  }
}