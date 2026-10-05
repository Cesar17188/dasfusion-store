import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../models/supabase.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    this.supabase = createClient<Database>(
      environment.supabaseUrl,
      environment.supabaseAnonKey
    );
  }

  get client(): SupabaseClient<Database> {
    return this.supabase;
  }

  get auth() {
    return this.supabase.auth;
  }

  get from() {
    return this.supabase.from.bind(this.supabase);
  }

  get storage() {
    return this.supabase.storage;
  }
}
