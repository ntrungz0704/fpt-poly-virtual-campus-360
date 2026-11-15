import { Controller, Get, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/auth.decorators";
import { NewsPublicService } from "./news-public.service";

@Controller("public/news")
@Public()
export class NewsPublicController {
  constructor(private readonly newsPublicService: NewsPublicService) {}

  @Get()
  listPublished(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("tag") tag?: string,
  ) {
    return this.newsPublicService.listPublished({ page, limit, tag });
  }

  @Get(":slug")
  getBySlug(@Param("slug") slug: string) {
    return this.newsPublicService.getBySlug(slug);
  }
}
