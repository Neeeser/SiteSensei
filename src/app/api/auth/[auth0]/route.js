import { handleAuth, handleCallback, getSession } from '@auth0/nextjs-auth0';
import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

async function updateUserInSupabase(user) {
  console.log('Updating user in Supabase:', user);

  try {
    // Check if user exists in the database
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('auth0_id', user.sub)
      .single();

    console.log('Existing user check result:', existingUser, fetchError);

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const userData = {
      auth0_id: user.sub,
      name: user.name || null,
      given_name: user.given_name || null,
      family_name: user.family_name || null,
      nickname: user.nickname || null,
      picture: user.picture || null,
      email: user.email || null,
      email_verified: user.email_verified || null,
      locale: user.locale || null,
      phone_number: user.phone_number || null,
      phone_number_verified: user.phone_number_verified || null,
      birthdate: user.birthdate || null,
      address: user.address ? JSON.stringify(user.address) : null,
      last_login: new Date().toISOString(),
    };

    let error;
    if (existingUser) {
      console.log('Updating existing user');
      // Only update fields that are different from existing data
      const updatedFields = Object.entries(userData).reduce((acc, [key, value]) => {
        if (value !== existingUser[key]) {
          acc[key] = value;
        }
        return acc;
      }, {});

      if (Object.keys(updatedFields).length > 0) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update(updatedFields)
          .eq('auth0_id', user.sub)
          .single();
        error = updateError;
        console.log('Update result:', updatedUser, updateError);
      } else {
        console.log('No fields to update');
      }
    } else {
      console.log('Inserting new user');
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(userData)
        .single();
      error = insertError;
      console.log('Insert result:', newUser, insertError);
    }

    if (error) throw error;
    console.log('User data updated successfully');
  } catch (error) {
    console.error('Error updating user in Supabase:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
  }
}

export const GET = handleAuth({
  async callback(req, res) {
    console.log('Auth0 callback route hit');
    try {
      console.log('Handling callback');
      const callbackResponse = await handleCallback(req, res);
      
      // After handleCallback, we can safely get the session
      const session = await getSession(req, res);
      console.log('Session after callback:', session);

      if (session && session.user) {
        await updateUserInSupabase(session.user);
      } else {
        console.error('No session or user data available after callback');
      }

      return callbackResponse;
    } catch (error) {
      console.error('Error in callback:', error);
      return NextResponse.json({ message: 'Error processing Auth0 callback' }, { status: 500 });
    }
  },
});
