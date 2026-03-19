//package com.yeogi.toilet.emergency_toilet.signup.service;
//
//import com.google.cloud.firestore.Firestore;
//import com.google.cloud.firestore.QueryDocumentSnapshot;
//import com.google.firebase.cloud.FirestoreClient;
//import com.yeogi.toilet.emergency_toilet.signup.domain.SignUp;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.stereotype.Service;
//
//import java.util.List;
//
//@RequiredArgsConstructor
//@Slf4j
//@Service
//public class SignUpService {
//
//    Firestore db = FirestoreClient.getFirestore();
//
//    public boolean checkEmail(String email) throws Exception{
//
//
//        List<QueryDocumentSnapshot> document =  db.collection("users")
//                .whereEqualTo("email",email)
//                .get().get().getDocuments();
//
//        if(document.isEmpty()){
//            return false;
//        }
//        else{
//            return true;
//        }
//    }
//
//    public void getUser(SignUp signup) throws Exception{
//        db.collection("users").
//    }
//
//}
