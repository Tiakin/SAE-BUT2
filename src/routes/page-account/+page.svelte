<script>
    import { getUserData, isConnected, saveUserData } from "$lib/store.js";
    import Footer from "$lib/Footer.svelte";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";

    let user = getUserData() || { pseudo: "Invité", email: "", id: "" };

    const userUpdate = {
        type: "",
        pseudo: user.pseudo,
        email: user.email,
        password: "",
        new_password: "",
        confirm_password: "",
        id: user.id
    };

    let isEditingInfo = false;
    let isEditingPassword = false;
    let isSameInfo = false;
    let isSameEmail = false;
    let isNotSamePassword = false;
    let isNotActualPassword = false;
    let successMessage = false;
    let isSamePseudo = false;
    let isWrongPassword = false;

    async function updateUser() {

        isSameInfo = false;
        isSameEmail = false;
        isSamePseudo = false;
        isWrongPassword = false;

        if (userUpdate.pseudo !== user.pseudo || userUpdate.email !== user.email) {

            userUpdate.type = "update-info";

            const response = await fetch("/page-account/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userUpdate),
            });

            if (response.ok) {

                successMessage = true;

                userUpdate.type = "";
                isEditingInfo = false;

                saveUserData(userUpdate.email, userUpdate.pseudo, userUpdate.id);
                user = getUserData();

                refreshForm();


            } else {
                const errorMessage = await response.json();

                if (errorMessage.message === "Email already exists") {
                    isSameEmail = true;
                } else if (errorMessage.message === "Pseudo already exists") {
                    isSamePseudo = true;
                } else if (errorMessage.message === "Wrong password") {
                    isWrongPassword = true;
                } else {
                    successMessage = false;
                }
            }
        } else {
            isSameInfo = true;
        }
    }

    async function updatePassword() {

        isNotSamePassword = false;
        isNotActualPassword = false;    

        if (userUpdate.new_password !== userUpdate.confirm_password) {
            isNotSamePassword = true;
            return;
        }
        isNotSamePassword = false;
        isNotActualPassword = false;

        userUpdate.type = "update-password";

        const response = await fetch("/page-account/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userUpdate),
        });

        if (response.ok) {
            
            successMessage = true;

            userUpdate.type = "";
            isEditingPassword = false;
            refreshForm();
        } else {
            const errorMessage = await response.json();

            if (errorMessage.message === "Mot de passe actuel incorrect.") {
                isNotActualPassword = true;
            } else {
                successMessage = false;
            }
        }
    }

    function refreshForm() {
        userUpdate.pseudo = user.pseudo;
        userUpdate.email = user.email;
        userUpdate.password = "";
        userUpdate.new_password = "";
        userUpdate.confirm_password = "";

        isSameInfo = false;
        isSameEmail = false;
        isNotSamePassword = false;
        isNotActualPassword = false;
        isWrongPassword = false;
        isSamePseudo = false;
    }

</script>

<div class="flex flex-grow flex-col">
    <div class="container mx-auto p-4">

        {#if $isConnected === true}

            <h1 class="text-3xl font-bold text-center my-8">Welcome, {user.pseudo}</h1>

            <section class="account-information max-w-md mx-auto p-4 border rounded-lg shadow-md">
                {#if successMessage}
                    <p class="text-green-600 font-semibold mb-4">Successfully updated information</p>
                {/if}

                <!-- Affichage des informations utilisateur -->
                {#if !isEditingInfo && !isEditingPassword}
                    <h2 class="text-xl font-semibold mb-4">Personal information</h2>

                    <p><strong>Username :</strong> {user.pseudo}</p>
                    <p><strong>Email :</strong> {user.email}</p>

                    <div class="mt-5 flex justify-center space-x-4">
                        <button class="p-2 bg-teal-400 text-white font-bold rounded" on:click={() => {isEditingInfo = true, successMessage = false}}>Modify information</button>
                        <button class="p-2 bg-teal-400 text-white font-bold rounded" on:click={() => {isEditingPassword = true, successMessage = false}}>Modify password</button>
                    </div>

                {/if}

                <!-- Formulaire de modification des informations utilisateur -->
                {#if isEditingInfo}
                    <form on:submit|preventDefault={updateUser} class="mt-4">
                        <h2 class="text-xl font-semibold mb-4 text-gray-700">Modify Personal Information</h2>
                    
                        {#if isSameInfo}
                            <p class="text-red-600">You have not modified your information</p>
                        {/if}
                    
                        <label class="block mb-2 font-medium">Username:
                            <input type="text" bind:value="{userUpdate.pseudo}" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                        </label>

                        {#if isSamePseudo}
                            <p class="text-red-600">Pseudo already taken</p>
                        {/if}
                    
                        <label class="block mt-4 mb-2 font-medium">Email:
                            <input type="email" bind:value="{userUpdate.email}" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                        </label>
                        {#if isSameEmail}
                            <p class="text-red-600">Email already exists</p>
                        {/if}
                    
                        <label class="block mt-4 mb-2 font-medium">Enter your current password:
                            <input type="password" bind:value="{userUpdate.password}" 
                                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                        </label>

                        {#if isWrongPassword}
                            <p class="text-red-600">Incorrect password</p>
                        {/if}
                    
                        <div class="mt-5 flex justify-center space-x-4">
                            <button type="submit" 
                                    class="px-4 py-2 bg-teal-400 text-white font-bold rounded-lg hover:bg-green-700 transition duration-200">
                                Save
                            </button>
                            <button type="button" 
                                    class="px-4 py-2 bg-gray-500 text-white font-bold rounded-lg hover:bg-gray-600 transition duration-200" 
                                    on:click={() => {isEditingInfo = false; isSameInfo = false; isWrongPassword = false; refreshForm()}}>
                                Cancel
                            </button>
                        </div>
                    </form>
                
                {/if}

                <!-- Formulaire de modification du mot de passe -->
                {#if isEditingPassword}
                    <form on:submit|preventDefault={updatePassword}>

                        <h2 class="text-xl font-semibold mb-4">Change password</h2>

                        {#if isNotActualPassword}
                            <p class="text-red-600">Current password is incorrect</p>
                            <!-- rajouter un mdp oublié ici ? -->
                        {/if}

                        <label for="current_password" class="block mb-2 font-medium">Current password :</label>
                        <input type="password" name="current_password" id="current_password" bind:value="{userUpdate.password}" class="w-full p-2 border rounded mb-4" required />

                        {#if isNotSamePassword}
                            <p class="text-red-600">Passwords don't match</p>
                        {/if} 

                        <label for="new_password" class="block mb-2 font-medium">New password :</label>
                        <input type="password" name="new_password" id="new_password" bind:value="{userUpdate.new_password}" class="w-full p-2 border rounded mb-4" required />

                        <label for="confirm_password" class="block mb-2 font-medium">Confirm password :</label>
                        <input type="password" name="confirm_password" id="confirm_password" bind:value="{userUpdate.confirm_password}" class="w-full p-2 border rounded mb-4" required />

                        <div class="flex justify-center space-x-4">
                            <button type="submit" class="p-2 bg-teal-400 text-white font-bold rounded">Register</button>
                            <button type="button" class="p-2 bg-gray-600 text-white font-bold rounded" on:click={() => {isEditingPassword = false;refreshForm()}}>Cancel</button>
                        </div>
                    </form>
                {/if}
            </section>

        {:else}
            <div class="flex flex-col items-center h-full">

                <h1 class="text-3xl font-bold text-center my-8">Welcome future traveler</h1>

                <p>You are not logged in!</p>
                <p>To login or register, click here :</p>

                <div class="mt-4 flex flex-row space-x-1">

                    <button
                        class="text-sm my-1 mx-1 px-3 py-1 rounded bg-teal-400 hover:bg-teal-500 text-white transition duration-200"
                        on:click={goto("/page-connection/connection/")}>Login</button>

                    <button
                        class="text-sm my-1 px-3 py-1 rounded bg-teal-400 hover:bg-teal-500 text-white transition duration-200"
                        on:click={goto("/page-connection/register/")}>Sign in</button>

                </div>

            </div>
        {/if}

    </div>
    <div class="mt-auto bg-gray-900 p-5">
        <Footer />
    </div>
</div>