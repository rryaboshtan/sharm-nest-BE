import {IsNotEmpty, IsOptional} from "class-validator";
import { Category } from "../entities/category.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCategoryDto {
   @ApiProperty()
   @IsNotEmpty()
   title: string;

   @ApiProperty()
   @IsNotEmpty()
   url: string;

   @ApiProperty()
   @IsOptional()
   description: string;

   @ApiProperty()
   @IsNotEmpty()
   // parent: number;
   parent: Category;
}
