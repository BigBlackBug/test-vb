import { z } from 'zod';

// Definition for a Zod function which can take any number of arguments of any type and return any type
// This is useful so we can validate that a method is a function without strictly enforcing types
// on the arguments or return value, because Zod can be a little overly aggressive with that
export const GenericZodFunction = z.instanceof(Function);
